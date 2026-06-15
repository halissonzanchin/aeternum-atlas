export default function BarChart({ data, labelKey = "date", valueKey = "accesses" }) {
  const max = Math.max(...data.map(item => item[valueKey]));

  return (
    <div className="grid gap-2">
      {data.map(item => (
        <div key={item[labelKey]} className="grid grid-cols-[92px_1fr_56px] items-center gap-3 text-xs text-slate-300">
          <span className="truncate">{item[labelKey]}</span>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-techTeal" style={{ width: `${(item[valueKey] / max) * 100}%` }} />
          </div>
          <strong className="text-right text-clinicalWhite">{item[valueKey]}</strong>
        </div>
      ))}
    </div>
  );
}
