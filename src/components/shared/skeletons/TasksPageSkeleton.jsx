// src/components/shared/skeletons/TasksPageSkeleton.jsx
import Skeleton from "@/components/shared/Skeleton";
import TableSkeleton from "./TableSkeleton";

export default function TasksPageSkeleton() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <Skeleton width={280} height={14} />
        <Skeleton width={110} height={32} radius={7} />
      </div>

      <div className="stat-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton width="60%" height={10} style={{ marginBottom: 10 }} />
            <Skeleton width="40%" height={26} />
          </div>
        ))}
      </div>

      <div className="filters">
        <Skeleton width={260} height={34} radius={8} />
        <Skeleton width={160} height={34} radius={8} />
        <Skeleton width={160} height={34} radius={8} />
      </div>

      <TableSkeleton columns={7} rows={6} />
    </div>
  );
}