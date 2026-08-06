// src/app/tasks/digest/page.js
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ExcelJS from "exceljs";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Icon from "@/lib/Icon";

function formatDuration(ms) {
  if (ms == null) return "-";
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 1) return "< 1 menit";
  if (totalMinutes < 60) return `${totalMinutes} menit`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours < 24) return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days} hari ${remHours} jam` : `${days} hari`;
}

const ROLE_FILTER_LABELS = {
  all: "Semua (Dibuat + Diterima)",
  assigned_to_me: "Ditugaskan ke Saya",
  assigned_by_me: "Saya yang Assign",
};

const ROLE_FILTER_ORDER = ["all", "assigned_to_me", "assigned_by_me"];

export default function TaskMonthlyDigestPage() {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [roleFilter, setRoleFilter] = useState("all");
  const [stats, setStats] = useState(null);
  const [syncedAt, setSyncedAt] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [narrative, setNarrative] = useState(null);
  const [generateCount, setGenerateCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [narrativeError, setNarrativeError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [printData, setPrintData] = useState(null); // { all, assigned_to_me, assigned_by_me }
  const [printLoading, setPrintLoading] = useState(false);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        const list = d.employees || [];
        setEmployees(list);
        if (list.length > 0) setEmployeeId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    setNarrativeError(null);
    fetch(`/api/tasks/monthly-digest?employeeId=${employeeId}&year=${year}&month=${month}&roleFilter=${roleFilter}`)
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats || null);
        setSyncedAt(d.syncedAt || null);
        setNarrative(d.narrative || null);
        setGenerateCount(d.generateCount || 0);
        setLoading(false);
      });
  }, [employeeId, year, month, roleFilter]);

  // "Hitung Sekarang" — recomputes and caches this one employee's stats
  // for the currently selected month.
  async function handleSync() {
    setSyncing(true);
    setNarrativeError(null);
    try {
      const res = await fetch("/api/tasks/monthly-digest/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, year, month }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNarrativeError(data.error || "Gagal menghitung data.");
      } else {
        const statsByFilter = { all: data.statsAll, assigned_to_me: data.statsToMe, assigned_by_me: data.statsByMe };
        setStats(statsByFilter[roleFilter] || null);
        setSyncedAt(data.syncedAt || null);
      }
    } catch {
      setNarrativeError("Gagal menghubungi server.");
    } finally {
      setSyncing(false);
    }
  }

  // "Sync Semua Employee" — same recompute, for every employee at once.
  async function handleSyncAll() {
    if (!employees.length) return;
    setSyncingAll(true);
    setNarrativeError(null);
    try {
      const res = await fetch("/api/tasks/monthly-digest/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: employees.map((e) => e.id), year, month }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNarrativeError(data.error || "Gagal sync semua employee.");
      } else {
        // The currently-viewed employee was included in this batch too —
        // refresh what's on screen so it doesn't look stale.
        const mine = (data.results || []).find((r) => r.employeeId === employeeId);
        if (mine) {
          const statsByFilter = { all: mine.statsAll, assigned_to_me: mine.statsToMe, assigned_by_me: mine.statsByMe };
          setStats(statsByFilter[roleFilter] || null);
          setSyncedAt(mine.syncedAt || null);
        }
      }
    } catch {
      setNarrativeError("Gagal menghubungi server.");
    } finally {
      setSyncingAll(false);
    }
  }

  function changeMonth(delta) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  async function handleGenerate() {
    setGenerating(true);
    setNarrativeError(null);
    try {
      const res = await fetch("/api/tasks/monthly-digest/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, year, month }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNarrativeError(data.error || "Gagal generate ringkasan.");
      } else {
        setNarrative(data.narrative);
        setGenerateCount(data.generateCount);
      }
    } catch {
      setNarrativeError("Gagal menghubungi AI. Coba lagi.");
    } finally {
      setGenerating(false);
    }
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  async function fetchStatsForFilter(filter) {
    const res = await fetch(`/api/tasks/monthly-digest?employeeId=${employeeId}&year=${year}&month=${month}&roleFilter=${filter}`);
    const data = await res.json();
    return data.stats || null;
  }

  async function handleExportPDF() {
    if (!employeeId) return;
    setPrintLoading(true);
    try {
      const results = {};
      for (const filter of ROLE_FILTER_ORDER) {
        results[filter] = filter === roleFilter ? stats : await fetchStatsForFilter(filter);
      }
      setPrintData(results);
      // Give React a tick to render the print-only block before opening print dialog.
      setTimeout(() => window.print(), 150);
    } catch {
      setNarrativeError("Gagal menyiapkan data untuk export PDF.");
    } finally {
      setPrintLoading(false);
    }
  }

  // Pulls the monthly digest for every employee (not just the one currently
  // selected in the dropdown) and lays them out as one row per employee —
  // matching the flat table format Thom wants, instead of the old
  // single-employee vertical report. The "Ringkasan AI" column reads
  // whatever narrative each employee already has saved — it does NOT
  // trigger a fresh Claude generation per employee here, since that would
  // be slow (N sequential AI calls) and would silently burn into each
  // employee's 2x/month generate limit without them asking for it.
  async function handleExportExcel() {
    if (!employees.length) return;
    setExportingExcel(true);
    try {
      // Single batched request instead of one fetch per employee — see
      // computeMonthlyTaskStatsBatch for why that used to be expensive
      // once the employee list got long.
      const res = await fetch("/api/tasks/monthly-digest/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: employees.map((e) => e.id), year, month, roleFilter }),
      });
      const data = await res.json();
      const allResults = data.results || [];

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "VERA";
      const sheet = workbook.addWorksheet("Digest Bulanan");

      const HEADERS = [
        "Employee", "Periode", "Filter", "Total Tiket", "Sudah Direspon", "Belum Direspon",
        "Rata-rata First Response", "Respon Tercepat", "Respon Terlama", "Ringkasan AI",
      ];
      sheet.columns = [
        { width: 22 }, { width: 16 }, { width: 26 }, { width: 12 }, { width: 14 },
        { width: 14 }, { width: 20 }, { width: 30 }, { width: 30 }, { width: 60 },
      ];

      const headerRow = sheet.addRow(HEADERS);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D5FA0" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
      });
      headerRow.height = 22;
      sheet.views = [{ state: "frozen", ySplit: 1 }];

      allResults.forEach(({ employee, stats: s, narrative: n, syncedAt: rowSyncedAt }) => {
        const notSynced = !rowSyncedAt;
        const fastestLabel = s?.fastest ? `${formatDuration(s.fastest.responseMs)} — ${s.fastest.title}` : "-";
        const slowestLabel = s?.slowest ? `${formatDuration(s.slowest.responseMs)} — ${s.slowest.title}` : "-";

        const row = sheet.addRow([
          employee.name,
          monthLabel,
          ROLE_FILTER_LABELS[roleFilter],
          notSynced ? "-" : s?.totalTickets ?? 0,
          notSynced ? "-" : s?.respondedCount ?? 0,
          notSynced ? "-" : s?.unrespondedCount ?? 0,
          notSynced ? "-" : s?.avgMs != null ? formatDuration(s.avgMs) : "-",
          notSynced ? "-" : fastestLabel,
          notSynced ? "-" : slowestLabel,
          notSynced ? "(belum di-sync)" : n || "(belum di-generate)",
        ]);

        row.getCell(4).font = { bold: true, color: { argb: "FF1D5FA0" } }; // Total Tiket
        row.getCell(5).font = { bold: true, color: { argb: "FF3F9D4E" } }; // Sudah Direspon
        row.getCell(6).font = { bold: true, color: { argb: "FFC98A18" } }; // Belum Direspon
        if (s?.fastest) row.getCell(8).font = { color: { argb: "FF3F9D4E" } };
        if (s?.slowest) row.getCell(9).font = { color: { argb: "FFD6543F" } };
        row.getCell(10).alignment = { wrapText: true, vertical: "top" };

        row.height = Math.max(20, Math.ceil((n?.length || 20) / 55) * 15);
        row.eachCell((cell) => {
          cell.border = { bottom: { style: "thin", color: { argb: "FFE8EBEF" } } };
          if (cell.col !== 10) cell.alignment = { ...cell.alignment, vertical: "top" };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeMonth = monthLabel.replace(/\s+/g, "-");
      a.href = url;
      a.download = `Digest-Bulanan-Semua-Karyawan-${safeMonth}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingExcel(false);
    }
  }

  function renderPrintSection(filterKey, s) {
    if (!s) return null;
    return (
      <div key={filterKey} style={{ marginBottom: 24, breakInside: "avoid" }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, borderBottom: "1px solid #111", paddingBottom: 4 }}>
          {ROLE_FILTER_LABELS[filterKey]}
        </div>
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr) 1.3fr" }}>
          <div className="stat-card blue">
            <div className="stat-label">Total Tiket</div>
            <div className="stat-value">{s.totalTickets}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Sudah Direspon</div>
            <div className="stat-value">{s.respondedCount}</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-label">Belum Direspon</div>
            <div className="stat-value">{s.unrespondedCount}</div>
          </div>
          <div className="task-digest-hero">
            <div className="lbl">Rata-rata First Response</div>
            <div className="val">{s.avgMs != null ? formatDuration(s.avgMs) : "-"}</div>
          </div>
        </div>
        {s.totalTickets > 0 && (
          <div className="form-row two" style={{ marginTop: 0, marginBottom: 0 }}>
            <div className="card-note">
              <div style={{ fontSize: 11, marginBottom: 4 }}>Respon Tercepat</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {s.fastest ? `${formatDuration(s.fastest.responseMs)} — ${s.fastest.title}` : "-"}
              </div>
            </div>
            <div className="card-note">
              <div style={{ fontSize: 11, marginBottom: 4 }}>Respon Terlama</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {s.slowest ? `${formatDuration(s.slowest.responseMs)} — ${s.slowest.title}` : "-"}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <Link href="/tasks" className="task-back-btn no-print">
          <Icon name="arrow-left" size={13} /> Kembali
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div className="table-title" style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <Icon name="ticket" size={17} style={{ color: "var(--accent)" }} /> Digest Bulanan
          </div>
          <div className="no-print" style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleSyncAll} disabled={!employees.length || syncingAll}>
              <Icon name="refresh" size={13} className={syncingAll ? "spin" : ""} />{" "}
              {syncingAll ? `Sync ${employees.length} karyawan...` : "Sync Semua Employee"}
            </button>
            <button className="btn btn-secondary" onClick={handleExportExcel} disabled={!employees.length || exportingExcel}>
              <Icon name="file-text" size={13} /> {exportingExcel ? "Menyiapkan..." : "Export Excel (Semua Karyawan)"}
            </button>
            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={!stats || printLoading}>
              <Icon name="file-text" size={13} /> {printLoading ? "Menyiapkan..." : "Export PDF"}
            </button>
          </div>
        </div>

        <p className="task-digest-note" style={{ maxWidth: 900 }}>
          Rata-rata waktu respon dihitung dari saat tiket dibuat sampai balasan pertama dari agent. Angka ini di-cache, bukan dihitung ulang
          otomatis — klik "Hitung Sekarang" atau "Sync Semua Employee" untuk memperbarui.
        </p>

        <div className="task-digest-toolbar no-print" style={{ justifyContent: "space-between", margin: "18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="task-digest-nav" onClick={() => changeMonth(-1)}>
              <Icon name="chevron-left" size={13} />
            </button>
            <span className="task-digest-label" style={{ minWidth: "auto" }}>{monthLabel}</span>
            <button className="task-digest-nav" onClick={() => changeMonth(1)}>
              <Icon name="chevron-right" size={13} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="input" style={{ width: 190 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">Semua</option>
              <option value="assigned_to_me">Ditugaskan ke Saya</option>
              <option value="assigned_by_me">Saya yang Assign</option>
            </select>
            <select className="input" style={{ width: 200 }} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="no-print" style={{ textAlign: "center", color: "var(--text3)", fontSize: 12.5, padding: "20px 0" }}>
            Memuat data...
          </p>
        ) : !stats ? (
          <div className="no-print" style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 14 }}>
              Data untuk <strong>{monthLabel}</strong> belum pernah dihitung.
            </p>
            <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
              {syncing && <Icon name="refresh" size={11} className="spin" />} {syncing ? "Menghitung..." : "Hitung Sekarang"}
            </button>
            {narrativeError && <p style={{ fontSize: 11, color: "var(--red)", marginTop: 10 }}>{narrativeError}</p>}
          </div>
        ) : (
          <div className="no-print">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
                fontSize: 11,
                color: "var(--text3)",
              }}
            >
              <span>Terakhir dihitung: {syncedAt ? new Date(syncedAt).toLocaleString("id-ID") : "-"}</span>
              <button className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={handleSync} disabled={syncing}>
                {syncing && <Icon name="refresh" size={11} className="spin" />} {syncing ? "Menghitung..." : "Hitung Ulang"}
              </button>
            </div>
            <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr) 1.3fr" }}>
              <div className="stat-card blue">
                <div className="stat-label">Total Tiket</div>
                <div className="stat-value">{stats.totalTickets}</div>
              </div>
              <div className="stat-card green">
                <div className="stat-label">Sudah Direspon</div>
                <div className="stat-value">{stats.respondedCount}</div>
              </div>
              <div className="stat-card yellow">
                <div className="stat-label">Belum Direspon</div>
                <div className="stat-value">{stats.unrespondedCount}</div>
              </div>
              <div className="task-digest-hero">
                <div className="lbl">Rata-rata First Response</div>
                <div className="val">{stats.avgMs != null ? formatDuration(stats.avgMs) : "-"}</div>
              </div>
            </div>

            {stats.totalTickets > 0 && (
              <div className="form-row two" style={{ marginBottom: 18 }}>
                <div className="card-note">
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Respon Tercepat</div>
                  {stats.fastest ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>{formatDuration(stats.fastest.responseMs)}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{stats.fastest.title}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--text3)" }}>-</div>
                  )}
                </div>
                <div className="card-note">
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Respon Terlama</div>
                  {stats.slowest ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)" }}>{formatDuration(stats.slowest.responseMs)}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{stats.slowest.title}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--text3)" }}>-</div>
                  )}
                </div>
              </div>
            )}

            <div className="task-ai-card purple" style={{ margin: 0 }}>
              <div className="task-ai-card-head">
                <span className="task-ai-card-title purple">
                  <Icon name="sparkles" size={12} /> Ringkasan AI
                </span>
                <div className="task-ai-card-actions">
                  <button onClick={handleGenerate} disabled={generating || generateCount >= 2 || stats.totalTickets === 0}>
                    {generating && <Icon name="refresh" size={11} className="spin" />}
                    {generateCount >= 2 ? "Batas habis (2/2)" : narrative ? `Regenerate (${generateCount}/2)` : `Generate (${generateCount}/2)`}
                  </button>
                </div>
              </div>
              {narrative ? (
                <p className="task-ai-card-body">{narrative}</p>
              ) : (
                <p className="task-ai-card-placeholder">Klik "Generate" untuk mendapatkan ringkasan naratif dari data statistik di atas.</p>
              )}
              {narrativeError && <p style={{ fontSize: 11, color: "var(--red)", marginTop: 5 }}>{narrativeError}</p>}
            </div>
          </div>
        )}

        {/* Laporan lengkap 3 filter — cuma muncul pas print/export PDF */}
        {printData && (
          <div className="print-only">
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid #ccc" }}>
              <strong>
                {printData.all?.employeeName || printData.assigned_to_me?.employeeName || printData.assigned_by_me?.employeeName || "-"}
              </strong>{" "}
              — {monthLabel}
            </p>

            {ROLE_FILTER_ORDER.map((filterKey) => renderPrintSection(filterKey, printData[filterKey]))}

            <div className="task-ai-card purple" style={{ margin: 0 }}>
              <div className="task-ai-card-head">
                <span className="task-ai-card-title purple">
                  <Icon name="sparkles" size={12} /> Ringkasan AI
                </span>
              </div>
              {narrative ? (
                <p className="task-ai-card-body">{narrative}</p>
              ) : (
                <p className="task-ai-card-placeholder">(belum di-generate)</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}