// src/components/shared/skeletons/TableSkeleton.jsx
import Skeleton from "@/components/shared/Skeleton";

export default function TableSkeleton({ columns = 5, rows = 8, columnWidths }) {
  const widths = columnWidths || Array.from({ length: columns }, () => "75%");
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton width="55%" height={9} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  <Skeleton width={widths[c] || "75%"} height={12} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}