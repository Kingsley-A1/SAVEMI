"use client";

/**
 * A single 6-digit code field, set wide and monospaced so the digits are easy
 * to read back against the email. Deliberately one input rather than six boxes:
 * it pastes cleanly, works with autofill and password managers, and is far
 * kinder to screen readers.
 */
export default function CodeInput({
  id = "code",
  value,
  onChange,
  disabled,
  label = "6-digit code",
  hint,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="field-input text-center text-lg font-semibold tracking-[0.5em]"
        style={{ fontFamily: "var(--font-mono, monospace)" }}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        placeholder="000000"
        required
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
      />
      {hint ? <p className="text-brand-muted mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}
