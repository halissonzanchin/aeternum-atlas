/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { forwardRef, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import LineIcon from "../icons/LineIcon";
import A26Surface from "./A26Surface";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export const A26Button = forwardRef(function A26Button({
  variant = "liquid",
  loading = false,
  disabled = false,
  icon,
  children,
  className = "",
  ...props
}, ref) {
  const material = variant === "primary" ? "regular" : variant === "ghost" ? "opaque" : "clear";
  const tone = variant === "danger"
    ? "danger"
    : ["primary", "liquid"].includes(variant)
      ? "teal"
      : "neutral";

  return (
    <A26Surface
      ref={ref}
      as="button"
      type="button"
      material={material}
      tone={tone}
      interactive={!disabled && !loading}
      className={joinClasses("a26-button", `a26-button--${variant}`, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="a26-spinner" aria-hidden="true" /> : icon}
      <span className="a26-button__content">{children}</span>
    </A26Surface>
  );
});

export const A26IconButton = forwardRef(function A26IconButton({
  label,
  icon = "settings",
  variant = "liquid",
  className = "",
  ...props
}, ref) {
  return (
    <A26Button
      ref={ref}
      variant={variant}
      className={joinClasses("a26-icon-button", className)}
      aria-label={label}
      title={label}
      {...props}
    >
      <LineIcon name={icon} className="h-5 w-5" />
      <span className="a26-visually-hidden">{label}</span>
    </A26Button>
  );
});

export function A26Toolbar({ as = "div", label, children, className = "", ...props }) {
  return (
    <A26Surface
      as={as}
      material="regular"
      className={joinClasses("a26-toolbar", className)}
      aria-label={label}
      {...props}
    >
      {children}
    </A26Surface>
  );
}

export function A26Sidebar({ label, children, className = "", ...props }) {
  return (
    <A26Surface
      as="aside"
      material="regular"
      className={joinClasses("a26-sidebar", className)}
      aria-label={label}
      {...props}
    >
      {children}
    </A26Surface>
  );
}

export function A26TabBar({ label, children, className = "", ...props }) {
  return (
    <A26Surface
      as="nav"
      material="clear"
      className={joinClasses("a26-tab-bar", className)}
      aria-label={label}
      {...props}
    >
      {children}
    </A26Surface>
  );
}

export function A26Card({
  as = "section",
  material = "opaque",
  interactive = false,
  tone = "neutral",
  className = "",
  children,
  ...props
}) {
  return (
    <A26Surface
      as={as}
      material={material}
      tone={tone}
      interactive={interactive}
      className={joinClasses("a26-card", className)}
      {...props}
    >
      {children}
    </A26Surface>
  );
}

export function A26Metric({ label, value = "—", detail, trend, icon, tone = "neutral", className = "" }) {
  return (
    <A26Card className={joinClasses("a26-metric", className)} tone={tone}>
      <div className="a26-metric__top">
        <span className="a26-metric__label">{label}</span>
        {icon ? <span className="a26-metric__icon" aria-hidden="true">{icon}</span> : null}
      </div>
      <strong className="a26-metric__value">{value}</strong>
      {detail ? <span className="a26-metric__detail">{detail}</span> : null}
      {trend ? <span className="a26-metric__trend">{trend}</span> : null}
    </A26Card>
  );
}

export const A26Field = forwardRef(function A26Field({
  as: Control = "input",
  label,
  hint,
  error,
  className = "",
  id,
  children,
  ...props
}, ref) {
  const generatedId = useId();
  const controlId = id || generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const controlProps = {
    ref,
    id: controlId,
    className: "a26-field__control",
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    ...props
  };

  return (
    <label className={joinClasses("a26-field", className)} htmlFor={controlId}>
      <span className="a26-field__label">{label}</span>
      {Control === "input"
        ? <input {...controlProps} />
        : <Control {...controlProps}>{children}</Control>}
      {hint ? <small id={hintId} className="a26-field__hint">{hint}</small> : null}
      {error ? <small id={errorId} className="a26-field__error" role="alert">{error}</small> : null}
    </label>
  );
});

export function A26SegmentedControl({ label, options, value, onChange, className = "" }) {
  return (
    <div className={joinClasses("a26-segmented", className)} role="group" aria-label={label}>
      {options.map(option => {
        const optionValue = typeof option === "string" ? option : option.value;
        const optionLabel = typeof option === "string" ? option : option.label;
        const selected = optionValue === value;

        return (
          <button
            key={optionValue}
            type="button"
            className={selected ? "is-selected" : ""}
            aria-pressed={selected}
            onClick={() => onChange?.(optionValue)}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}

export function A26Modal({ open, title, description, children, actions, onClose, closeLabel = "Fechar", className = "" }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"
    );
    focusable?.[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal((
    <div
      className="a26-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <A26Surface
        ref={dialogRef}
        as="section"
        material="substantial"
        className={joinClasses("a26-modal", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className="a26-modal__header">
          <div>
            <span className="a26-kicker">Aeternum 26</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <A26IconButton label={closeLabel} icon="close" onClick={onClose} />
        </header>
        {description ? <p id={descriptionId} className="a26-modal__description">{description}</p> : null}
        <div className="a26-modal__content">{children}</div>
        {actions ? <footer className="a26-modal__actions">{actions}</footer> : null}
      </A26Surface>
    </div>
  ), document.body);
}

export function A26Popover({ open, label, children, onClose, className = "" }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.({ reason: "escape" });
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <A26Surface
      material="regular"
      className={joinClasses("a26-popover", className)}
      role="dialog"
      aria-label={label}
    >
      {children}
    </A26Surface>
  );
}

function StateShell({ kind, icon, title, text, action }) {
  return (
    <A26Card className={joinClasses("a26-state", `a26-state--${kind}`)}>
      <span className="a26-state__icon" aria-hidden="true">
        {kind === "loading" ? <span className="a26-spinner" /> : <LineIcon name={icon} className="h-6 w-6" />}
      </span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
        {action ? <div className="a26-state__action">{action}</div> : null}
      </div>
    </A26Card>
  );
}

export function A26EmptyState({ title = "Nenhum registro", text, action }) {
  return <StateShell kind="empty" icon="library" title={title} text={text} action={action} />;
}

export function A26LoadingState({ title = "Carregando", text = "Validando a fonte e preparando o conteúdo." }) {
  return <StateShell kind="loading" title={title} text={text} />;
}

export function A26ErrorState({ title = "Não foi possível carregar", text, action }) {
  return <StateShell kind="error" icon="help" title={title} text={text} action={action} />;
}

export function A26DataDisclosure({ summary, meta, children, className = "" }) {
  return (
    <A26Card as="details" className={joinClasses("a26-disclosure", className)}>
      <summary>
        <span>{summary}</span>
        {meta ? <small>{meta}</small> : null}
        <LineIcon name="chevron" className="h-4 w-4" />
      </summary>
      <div className="a26-disclosure__content">{children}</div>
    </A26Card>
  );
}

export function A26TutorSurface({ state = "ready", title = "Atlas AI Tutor", children, actions, className = "" }) {
  return (
    <A26Surface material="substantial" tone="teal" className={joinClasses("a26-tutor", className)}>
      <header className="a26-tutor__header">
        <span className={joinClasses("a26-tutor__orb", `is-${state}`)} aria-hidden="true" />
        <div>
          <span className="a26-kicker">Assistência contextual</span>
          <h2>{title}</h2>
          <p>{state === "thinking" ? "Processando contexto" : "Pronto para orientar"}</p>
        </div>
      </header>
      <div className="a26-tutor__content">{children}</div>
      {actions ? <footer className="a26-tutor__actions">{actions}</footer> : null}
    </A26Surface>
  );
}
