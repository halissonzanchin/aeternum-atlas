export default function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange?.(!checked)}
        className={`relative h-7 w-12 rounded-full border transition ${checked ? "border-techTeal/50 bg-techTeal/30" : "border-white/20 bg-white/10"}`}
      >
        <span className={`absolute top-1 size-5 rounded-full bg-clinicalWhite transition ${checked ? "left-6" : "left-1"}`} />
      </button>
    </label>
  );
}
