// src/components/shared/skeletons/EmployeesPageSkeleton.jsx
import Skeleton from "@/components/shared/Skeleton";
import TableSkeleton from "./TableSkeleton";

export default function EmployeesPageSkeleton() {
  return (
    <div>
      <div className="stat-grid" style={{ gridTemplateColumns: "220px 320px", marginBottom: 20 }}>
        <div className="stat-card blue">
          <Skeleton width="60%" height={10} style={{ marginBottom: 10 }} />
          <Skeleton width="40%" height={26} />
        </div>
        <div className="stat-card purple age-card">
          <Skeleton width={96} height={96} radius={96} />
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height={10} style={{ marginBottom: 12 }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="90%" height={10} style={{ marginBottom: 8 }} />
            ))}
          </div>
        </div>
      </div>

      <div className="section-header">
        <Skeleton width={180} height={16} />
        <Skeleton width={130} height={32} radius={7} />
      </div>

      <div className="filters">
        <Skeleton width={240} height={34} radius={8} />
        <Skeleton width={180} height={34} radius={8} />
        <Skeleton width={180} height={34} radius={8} />
      </div>

      <TableSkeleton columns={8} rows={8} />
    </div>
  );
}