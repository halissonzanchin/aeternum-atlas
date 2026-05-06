export default function IconButton({ label, active = false, children, className = "", ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`grid size-11 place-items-center rounded-2xl border text-sm font-black transition hover:-translate-y-0.5 hover:border-techTeal/50 hover:text-techTeal hover:shadow-glow ${active ? "border-techTeal/50 bg-techTeal/10 text-techTeal" : "border-white/10 bg-white/[0.04] text-slate-300"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
