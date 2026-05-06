export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-textMuted">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center gap-2">
          <span className={index === items.length - 1 ? "text-techTeal" : ""}>{item}</span>
          {index < items.length - 1 ? <span className="text-agedGold/50">/</span> : null}
        </span>
      ))}
    </nav>
  );
}
