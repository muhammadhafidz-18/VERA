// src/components/employees/Pagination.jsx
export default function Pagination({ page, totalPages, setPage, total, pageSize }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) pages.push(1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (end < totalPages) pages.push(totalPages);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text2)" }}>
      <span>
        Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} records
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          style={{ padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)", background: page <= 1 ? "var(--bg3)" : "var(--bg2)", cursor: page <= 1 ? "default" : "pointer", color: page <= 1 ? "var(--text3)" : "var(--text)", fontSize: 12 }}
        >
          &lsaquo;
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={"e" + i} style={{ padding: "0 4px", color: "var(--text3)" }}>
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                minWidth: 28,
                padding: "3px 7px",
                borderRadius: 5,
                border: "1px solid " + (p === page ? "var(--accent)" : "var(--border)"),
                background: p === page ? "var(--accent)" : "var(--bg2)",
                color: p === page ? "#fff" : "var(--text)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: p === page ? 700 : 400,
              }}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          style={{ padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)", background: page >= totalPages ? "var(--bg3)" : "var(--bg2)", cursor: page >= totalPages ? "default" : "pointer", color: page >= totalPages ? "var(--text3)" : "var(--text)", fontSize: 12 }}
        >
          &rsaquo;
        </button>
      </div>
    </div>
  );
}
