// src/components/shared/skeletons/SettingsPageSkeleton.jsx
import Skeleton from "@/components/shared/Skeleton";
import TableSkeleton from "./TableSkeleton";

export default function SettingsPageSkeleton() {
  return (
    <div>
      <div className="subtab-row">
        {["User Management", "Role Management", "Division", "Branch", "Voice AI", "Product Knowledge"].map((label, i) => (
          <div key={i} style={{ padding: "10px 16px" }}>
            <Skeleton width={label.length * 6} height={13} />
          </div>
        ))}
      </div>
      <TableSkeleton columns={5} rows={6} />
    </div>
  );
}