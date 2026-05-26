export default function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">{label}</label>
      {hint && <p className="text-[11px] text-white/35 mb-2">{hint}</p>}
      {!hint && <div className="mb-2" />}
      {children}
    </div>
  );
}
