import Button from "../Button/Button";

export default function Modal({ open, title, children, actions, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-xl">
      <section className="w-full max-w-md rounded-3xl border border-agedGold/25 bg-gradient-to-br from-graphite/90 to-blackDeep/95 p-6 shadow-premium">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl tracking-wide text-agedGold">{title}</h2>
          <Button variant="ghost" className="min-h-9 px-3" onClick={onClose}>×</Button>
        </div>
        <div className="mt-4 text-sm leading-7 text-textMuted">{children}</div>
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </section>
    </div>
  );
}
