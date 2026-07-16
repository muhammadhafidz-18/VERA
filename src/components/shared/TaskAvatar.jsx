// src/components/shared/TaskAvatar.jsx
export default function TaskAvatar({ name, size = 28 }) {
  const initials = (name || "?").split(" ")[0].slice(0, 2).toUpperCase();
  return (
    <div className="task-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </div>
  );
}
