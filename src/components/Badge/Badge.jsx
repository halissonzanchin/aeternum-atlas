export default function Badge({ tone = "teal", children, className = "" }) {
  const tones = {
    teal: "badge-teal",
    gold: "badge-gold",
    active: "badge-active",
    danger: "badge-danger"
  };

  return <span className={`badge ${tones[tone] || tones.teal} ${className}`}>{children}</span>;
}
