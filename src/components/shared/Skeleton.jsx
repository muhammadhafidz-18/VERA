// src/components/shared/Skeleton.jsx
export default function Skeleton({ width = "100%", height = 14, radius = 6, style, className = "" }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}