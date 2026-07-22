// src/app/api/employees/export/route.js
//
// Generates an .xlsx export of the employee directory, optionally filtered
// by division/branch/search (same query params as the AI tool that links
// here). Uses SheetJS (xlsx) — note: SheetJS has known vulnerabilities
// around PARSING untrusted files (prototype pollution, ReDoS), but this
// route only ever WRITES a workbook from our own trusted data, which isn't
// affected by those CVEs.
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getEmployees } from "@/lib/supabase/directory";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get("division") || undefined;
  const branch = searchParams.get("branch") || undefined;
  const search = searchParams.get("search") || undefined;

  const employees = await getEmployees({ division, branch, search });

  const rows = employees.map((e) => ({
    "Employee ID": e.id,
    Name: e.name,
    Email: e.email,
    Role: e.role,
    Division: e.division,
    Branch: e.branch,
    "Join Date": e.joinDate || "",
    "Birth Date": e.birthDate || "",
    Phone: e.phone || "",
    "Identity Number": e.identityNumber || "",
    Address: e.address || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 12 }, { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 32 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Directory");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const filenameParts = ["employee-directory"];
  if (division) filenameParts.push(division.toLowerCase().replace(/\s+/g, "-"));
  if (branch) filenameParts.push(branch.toLowerCase().replace(/\s+/g, "-"));
  filenameParts.push(new Date().toISOString().slice(0, 10));
  const filename = `${filenameParts.join("-")}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
