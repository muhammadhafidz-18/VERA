// src/app/api/vera/chat/route.js
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { VERA_TOOLS } from "@/lib/vera/tools";
import { buildVeraSystemPrompt } from "@/lib/vera/systemPrompt";
import { executeVeraTool } from "@/lib/vera/executeTool";
import { getDivisions, getBranches, bulkImportEmployees, bulkImportMasterList } from "@/lib/supabase/directory";
import { getIntegrationConfig } from "@/lib/supabase/integrations";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const MAX_TURNS = 5;
const MAX_IMPORT_ROWS = 500;

const VERA_TOOL_OPERATION_TYPE = {
  create_employee: "INSERT",
  create_meeting: "INSERT",
  create_task: "INSERT",
  add_division: "INSERT",
  add_branch: "INSERT",
  update_employee: "UPDATE",
  update_task: "UPDATE",
  update_division: "UPDATE",
  update_branch: "UPDATE",
  get_employees: "READ",
  get_meetings: "READ",
  get_tasks: "READ",
  get_divisions: "READ",
  get_branches: "READ",
  export_employees: "READ",
  search_product_knowledge: "READ",
  logout: "SESSION",
  reset_conversation: "SESSION",
};

const VERA_PLACEHOLDER_PATTERN =
  /(\blet me (?!know\b)\w+|checking now|one moment please|hold on a moment|i need to \w+|i'll \w+ .*(now|for you)|i will \w+ .*(now|for you)|i apologize for that|sorry (about|for) that|sebentar(?: ya)?[.,]|tunggu sebentar|mohon tunggu|saya (akan|perlu|harus|mau|butuh) (mengambil|akses|cek|periksa|memeriksa|mendapatkan)\b|perlu (meng)?(ambil|akses|cek|periksa|lihat|dapatkan) (data|direktori|informasi)|tool(nya| saya| ini)? (belum|tidak|masih belum) (terhubung|merespons|tersedia|jalan|connect)|belum terhubung|tidak terhubung ke|hubungi admin|coba (tanyakan|tanya) lagi|masalah berlanjut|sepertinya (ada )?(masalah|kendala|error))/i;
const VERA_META_PATTERN =
  /(don'?t have access|doesn'?t have access|no access to (a |the |any )?(live |real )?tool|aren'?t connected|isn'?t connected|not connected (right now|to)|my (own )?(tool|api)\b|in this (session|conversation)[, ]|i should be (honest|transparent)|to be (honest|transparent) with you|my previous (responses|answers)|(responses|answers) (were|are) inconsistent|flagging (this|it) to|contact (your |the )?(hr )?admin|hubungi (pihak )?admin|tool(nya| saya| ini)? (belum|tidak|masih belum) (terhubung|merespons|tersedia|jalan|connect)|belum terhubung|tidak terhubung ke)/i;
const VERA_SUCCESS_CLAIM_PATTERN =
  /(berhasil (ditambahkan|dibuat|dijadwalkan|di ?tambahkan|di ?assign)|telah (ditambahkan|dibuat|dijadwalkan|di ?assign)|sudah (ditambahkan|dibuat|dijadwalkan|di ?assign|diassign)|successfully (added|created|scheduled|assigned)|has been (added|created|scheduled|assigned)|karyawan baru .{0,40} (berhasil|sudah|telah)|meeting .{0,40} (sudah|telah) (dibuat|dijadwalkan)|task .{0,40} (sudah|telah) (dibuat|di ?assign))/i;
const VERA_RAW_DATA_PATTERN =
  /[\[{]\s*["{]|"[a-zA-Z_]+"\s*:\s*["\[{0-9]|\b(get_employees|create_employee)\s*\(|```|^\s*(javascript|json|python)\s*$/im;

const EMPLOYEE_HEADER_MAP = {
  "employee id": "id",
  "name": "name",
  "email": "email",
  "role": "role",
  "division": "division",
  "branch": "branch",
  "join date": "joinDate",
  "birth date": "birthDate",
  "phone": "phone",
  "identity number": "identityNumber",
  "address": "address",
};

const MASTER_LIST_HEADER_MAP = {
  "id": "id",
  "division name": "name",
  "branch name": "name",
  "name": "name",
};

// Asks Claude to phrase the (already-finished, already-in-database) import
// result in natural language. Claude is only given the exact result JSON
// and explicitly told not to invent numbers — this call has no tools
// attached, so there's no risk of it trying to "call" anything instead
// of just answering.
async function summarizeImportResultWithClaude(result, label) {
  const prompt = `Proses import ${label} berikut ini SUDAH selesai dan SUDAH benar-benar terjadi di database (bukan rencana, bukan simulasi). Jelaskan hasilnya ke user dalam 1-3 kalimat bahasa Indonesia yang natural, ramah, dan ringkas — gaya bicara asisten kantor yang santai tapi jelas.

Aturan:
- Sebutkan jumlah yang berhasil dibuat/diperbarui dan yang gagal, berdasarkan angka di data berikut.
- Kalau ada yang gagal, sebutkan maksimal 2-3 contoh baris yang gagal beserta alasan singkatnya.
- JANGAN mengarang angka, nama, atau detail apa pun yang tidak ada di data ini.
- JANGAN menyebut kata "JSON" atau "data mentah" ke user — cukup jelaskan hasilnya secara natural.

Data hasil import:
${JSON.stringify(result)}`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Anthropic API error");
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (text) return text;
  } catch (err) {
    console.error("[VERA] summarizeImportResultWithClaude error:", err);
  }

  return `Import ${label} selesai: ${result.created} berhasil dibuat${
    result.updated !== undefined ? `, ${result.updated} diperbarui` : ""
  }, ${result.failed} gagal dari ${result.total} baris.`;
}

// Parses a spreadsheet attachment sent through VERA chat and runs the
// matching bulk import — done here directly rather than via Claude, since
// Claude can't parse binary xlsx itself and we don't want it "narrating"
// a fake success. The result is then handed to Claude just to phrase the
// summary naturally (see summarizeImportResultWithClaude above).
async function handleSpreadsheetImport(attachment, lastUserText) {
  const text = (lastUserText || "").toLowerCase();
  let target = null;
  if (/\bbranch(es)?\b|\bcabang\b/i.test(text)) target = "branches";
  else if (/\bdivisi(on)?s?\b/i.test(text)) target = "divisions";
  else if (/\bkaryawan|employee|pegawai\b/i.test(text)) target = "employees";

  if (!target) {
    return "File-nya sudah saya terima, tapi saya belum yakin ini mau diimport ke mana — Employee, Division, atau Branch? Sebutkan salah satu, ya, terus kirim ulang filenya.";
  }

  let workbook;
  try {
    const buffer = Buffer.from(attachment.data, "base64");
    workbook = XLSX.read(buffer, { type: "buffer", cellFormula: false, bookVBA: false, cellHTML: false });
  } catch {
    return "Maaf, filenya gagal dibaca. Pastikan formatnya .xlsx, .xls, atau .csv yang valid, ya.";
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return "File-nya kosong, nggak ada sheet-nya.";

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", blankrows: false });
  if (rawRows.length < 2) return "File-nya nggak ada baris datanya.";

  const headerRow = rawRows[0].map((h) => String(h || "").trim().toLowerCase());

  if (target === "employees") {
    const fieldByCol = headerRow.map((h) => EMPLOYEE_HEADER_MAP[h] || null);
    if (!fieldByCol.includes("name") || !fieldByCol.includes("email")) {
      return "File-nya harus punya kolom Name dan Email buat import Employee. Coba pakai file hasil Export Employee sebagai template, ya.";
    }
    const rows = rawRows.slice(1, 1 + MAX_IMPORT_ROWS).map((row) => {
      const obj = {};
      fieldByCol.forEach((field, i) => {
        if (!field) return;
        const v = row[i];
        obj[field] = v === undefined || v === null ? "" : String(v).trim();
      });
      return obj;
    });
    const result = await bulkImportEmployees(rows);
    return summarizeImportResultWithClaude(result, "Employee");
  }

  // divisions / branches
  const fieldByCol = headerRow.map((h) => MASTER_LIST_HEADER_MAP[h] || null);
  const label = target === "branches" ? "Branch" : "Division";
  if (!fieldByCol.includes("name")) {
    return `File-nya harus punya kolom Name buat import ${label}. Coba pakai file hasil Export ${label} sebagai template, ya.`;
  }
  const rows = rawRows.slice(1, 1 + MAX_IMPORT_ROWS).map((row) => {
    const obj = { id: "", name: "" };
    fieldByCol.forEach((field, i) => {
      if (!field) return;
      const v = row[i];
      obj[field] = v === undefined || v === null ? "" : String(v).trim();
    });
    return obj;
  });
  const result = await bulkImportMasterList(target, rows);
  return summarizeImportResultWithClaude(result, label);
}

async function callAnthropic(messages, systemPrompt, toolChoice) {
  const body = { model: MODEL, max_tokens: 1024, system: systemPrompt, tools: VERA_TOOLS, messages };
  if (toolChoice) body.tool_choice = toolChoice;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[VERA] Anthropic API error:", data);
    throw new Error(data?.error?.message || `Anthropic API error (${res.status})`);
  }
  return data;
}

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server. Add it to .env.local." },
      { status: 500 }
    );
  }

  try {
    const { history, attachment } = await request.json();
    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json({ error: "Missing conversation history." }, { status: 400 });
    }

    const lastUserMsg = [...history].reverse().find((m) => m.role === "user");

    if (attachment?.kind === "spreadsheet" && attachment?.data) {
      const text = await handleSpreadsheetImport(attachment, lastUserMsg?.content);
      return NextResponse.json({ text, logoutRequested: false, resetRequested: false, dbOperationType: null });
    }

    const divisions = await getDivisions();
    const branches = await getBranches();
    const chatbaseConfig = await getIntegrationConfig("chatbase");
    const productKnowledgeEnabled = !!(chatbaseConfig?.enabled && chatbaseConfig?.apiKey && chatbaseConfig?.chatbotId);
    const systemPrompt = buildVeraSystemPrompt(divisions, branches, productKnowledgeEnabled);

    const lastUserWasConfirmation =
      lastUserMsg &&
      typeof lastUserMsg.content === "string" &&
      /^(ya|iya|yes|yep|yup|betul|benar|setuju|lanjutkan|oke|ok|correct|confirm(ed)?)[!.,\s]*$/i.test(lastUserMsg.content.trim());
    const lastUserLooksLikeDataSubmission =
      lastUserMsg &&
      typeof lastUserMsg.content === "string" &&
      /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(lastUserMsg.content) &&
      /(nama|name|divisi|division|cabang|branch)/i.test(lastUserMsg.content);

    let messages = history;

    if (attachment?.data && messages.length) {
      const lastIdx = messages.length - 1;
      const last = messages[lastIdx];
      if (last.role === "user") {
        const block =
          attachment.kind === "image"
            ? { type: "image", source: { type: "base64", media_type: attachment.mediaType, data: attachment.data } }
            : { type: "document", source: { type: "base64", media_type: attachment.mediaType, data: attachment.data } };
        messages = [
          ...messages.slice(0, lastIdx),
          { role: "user", content: [block, { type: "text", text: last.content || "Tolong ringkas isi dokumen ini." }] },
        ];
      }
    }
    let forceToolChoice = false;
    let logoutRequested = false;
    let resetRequested = false;
    let dbOperationType = null;
    let downloadUrl = null;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const toolChoice = forceToolChoice ? { type: "any" } : undefined;
      forceToolChoice = false;

      const data = await callAnthropic(messages, systemPrompt, toolChoice);
      const content = data.content || [];
      const toolUses = content.filter((b) => b.type === "tool_use");

      if (toolUses.length === 0) {
        const text = content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
        const looksLikePlaceholder = VERA_PLACEHOLDER_PATTERN.test(text);
        const looksLikeRawData = VERA_RAW_DATA_PATTERN.test(text);
        const looksLikeMeta = VERA_META_PATTERN.test(text);
        const looksLikeFalseSuccess = VERA_SUCCESS_CLAIM_PATTERN.test(text);
        const looksLikeDodgedConfirmation = lastUserWasConfirmation && !logoutRequested && !resetRequested;
        const looksLikeUnverifiedSubmission = lastUserLooksLikeDataSubmission && !dbOperationType;
        const isBad =
          looksLikePlaceholder ||
          looksLikeRawData ||
          looksLikeMeta ||
          looksLikeFalseSuccess ||
          looksLikeDodgedConfirmation ||
          looksLikeUnverifiedSubmission;

        if (isBad && turn < MAX_TURNS - 1) {
          const nudge = looksLikeUnverifiedSubmission
            ? "The user just gave you structured details (name/email/division/branch) to create a record, but no create tool has actually succeeded yet. Call the appropriate create tool right now with those exact details."
            : looksLikeDodgedConfirmation
            ? "The user just confirmed an action you asked about. Don't reply with a generic acknowledgment — call the corresponding tool right now (e.g. reset_conversation or logout) to actually carry it out."
            : looksLikeFalseSuccess
            ? "You just claimed something was added/created/scheduled, but you did NOT actually call the tool to do it. Call the correct tool for real right now."
            : looksLikeRawData
            ? "Don't output raw data, JSON, or fake function-call text to the user. Call the tool for real right now."
            : looksLikeMeta
            ? "Do not talk about tools, sessions, connections, or your own system/capabilities. You DO have real tools available right now. Call the appropriate one immediately."
            : "Please continue — actually call the tool now and give me the real answer, don't just say you'll check.";
          messages = [...messages, { role: "assistant", content }, { role: "user", content: nudge }];
          forceToolChoice = true;
          continue;
        }

        if (isBad) {
          return NextResponse.json({
            text: "Maaf, prosesnya belum berhasil diselesaikan. Coba ulangi permintaannya, ya.",
            logoutRequested,
            resetRequested,
            dbOperationType: null,
          });
        }

        return NextResponse.json({
          text: text || "Maaf, saya belum bisa menjawab itu sekarang.",
          logoutRequested,
          resetRequested,
          dbOperationType,
          downloadUrl,
        });
      }

      const toolResults = [];
      for (const tu of toolUses) {
        const result = await executeVeraTool(tu.name, tu.input || {}, { chatbaseConfig });
        if (tu.name === "logout" && result.success) logoutRequested = true;
        if (tu.name === "reset_conversation" && result.success) resetRequested = true;
        if (result.success) {
          const opType = VERA_TOOL_OPERATION_TYPE[tu.name];
          if (opType === "INSERT" || opType === "UPDATE") dbOperationType = opType;
          if (result.downloadUrl) downloadUrl = result.downloadUrl;
        }
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(result) });
      }

      messages = [...messages, { role: "assistant", content }, { role: "user", content: toolResults }];
    }

    return NextResponse.json({
      text: "Maaf, permintaan ini butuh beberapa langkah dan belum selesai. Coba pertanyaan yang lebih spesifik.",
      logoutRequested,
      resetRequested,
      dbOperationType,
    });
  } catch (err) {
    console.error("[VERA] chat route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}