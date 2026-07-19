// src/components/shared/skeletons/MeetingsPageSkeleton.jsx
import Skeleton from "@/components/shared/Skeleton";

export default function MeetingsPageSkeleton() {
  return (
    <div>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(2, 220px)" }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton width="60%" height={10} style={{ marginBottom: 10 }} />
            <Skeleton width="40%" height={26} />
          </div>
        ))}
      </div>

      <div className="section-header">
        <Skeleton width={180} height={16} />
        <Skeleton width={130} height={32} radius={7} />
      </div>

      <div className="cal-wrap">
        <div className="cal-toolbar">
          <Skeleton width={220} height={20} />
        </div>
        <div className="cal-head">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="cal-head-cell">
              <Skeleton width="50%" height={9} style={{ margin: "0 auto" }} />
            </div>
          ))}
        </div>
        <div className="cal-grid">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="cal-cell">
              <Skeleton width={20} height={20} radius={20} style={{ float: "right" }} />
              {i % 5 === 0 && <Skeleton width="80%" height={16} style={{ marginTop: 26, clear: "both" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}