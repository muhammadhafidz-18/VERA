// src/components/auth/PinBoxes.jsx
export default function PinBoxes({ values, onChangeAt, refsArr }) {
  const onChange = (i, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...values];
    next[i] = val;
    onChangeAt(next);
    if (val && i < 5) refsArr.current[i + 1]?.focus();
  };
  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !values[i] && i > 0) refsArr.current[i - 1]?.focus();
  };
  return (
    <div className="login-pin-row">
      {values.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refsArr.current[i] = el)}
          className="login-pin-box"
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
        />
      ))}
    </div>
  );
}
