import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getBranchesWithId } from "@/lib/supabase/directory";

export async function GET() {
  const branches = await getBranchesWithId();
  const rows = branches.map((b) => ({ ID: b.id, "Branch Name": b.name }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [{ wch: 38 }, { wch: 30 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Branches");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const filename = `branches-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}