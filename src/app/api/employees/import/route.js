// src/app/api/employees/import/route.js
//
// Parses an uploaded .xlsx/.xls/.csv and bulk-creates employees.
// NOTE: unlike the export route, this one DOES parse an untrusted file —
// SheetJS 0.18.5 has known CVEs around parsing (prototype pollution,
// ReDoS). We mitigate by: capping file size, disabling formula eval,
// reading rows as arrays (header:1) instead of trusting arbitrary object
// keys, and whitelisting only known column names before anything touches
// the database.
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { bulkImportEmployees } from "@/lib/supabase/directory";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 500;
const ALLOWED_EXT = [".xlsx", ".xls", ".csv"];

const HEADER_MAP = {
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

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });

  const fname = (file.name || "").toLowerCase();
  if (!ALLOWED_EXT.some((ext) => fname.endsWith(ext))) {
    return NextResponse.json({ error: "Only .xlsx, .xls, or .csv files are supported." }, { status: 400 });
  }

  let workbook;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    workbook = XLSX.read(buffer, { type: "buffer", cellFormula: false, bookVBA: false, cellHTML: false });
  } catch {
    return NextResponse.json({ error: "Failed to read the file. Make sure it's a valid Excel/CSV file." }, { status: 400 });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return NextResponse.json({ error: "The file has no sheets." }, { status: 400 });

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", blankrows: false });
  if (rawRows.length < 2) return NextResponse.json({ error: "The file has no data rows." }, { status: 400 });

  const headerRow = rawRows[0].map((h) => String(h || "").trim().toLowerCase());
  const fieldByCol = headerRow.map((h) => HEADER_MAP[h] || null);

  if (!fieldByCol.includes("name") || !fieldByCol.includes("email")) {
    return NextResponse.json({ error: "The file must have Name and Email columns (use the exported file as a template)." }, { status: 400 });
  }

  const employees = rawRows.slice(1, 1 + MAX_ROWS).map((row) => {
    const obj = {};
    fieldByCol.forEach((field, i) => {
      if (!field) return;
      const value = row[i];
      obj[field] = value === undefined || value === null ? "" : String(value).trim();
    });
    return obj;
  });

  const result = await bulkImportEmployees(employees);
  return NextResponse.json(result);
}