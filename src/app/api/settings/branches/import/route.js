import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { bulkImportMasterList } from "@/lib/supabase/directory";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 500;
const ALLOWED_EXT = [".xlsx", ".xls", ".csv"];

const HEADER_MAP = {
  "id": "id",
  "division name": "name",
  "branch name": "name",
  "name": "name",
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

  if (!fieldByCol.includes("name")) {
    return NextResponse.json({ error: "The file must have a Name column (use the exported file as a template)." }, { status: 400 });
  }

  const rows = rawRows.slice(1, 1 + MAX_ROWS).map((row) => {
    const obj = { id: "", name: "" };
    fieldByCol.forEach((field, i) => {
      if (!field) return;
      const value = row[i];
      obj[field] = value === undefined || value === null ? "" : String(value).trim();
    });
    return obj;
  });

  const result = await bulkImportMasterList("branches", rows);
  return NextResponse.json(result);
}