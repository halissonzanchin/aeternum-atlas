export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${active === tab ? "border-techTeal/50 bg-techTeal/10 text-techTeal" : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-techTeal/30"}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
