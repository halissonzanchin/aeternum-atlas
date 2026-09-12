export default function A26PageHeader({
  eyebrow,
  title,
  description,
  status,
  primaryAction,
  secondaryAction,
  children,
  variant = "standard", // "standard" | "compact" | "canvas"
  className = "",
  titleAs = "h1",
  ...props
}) {
  const TitleTag = titleAs;

  return (
    <header
      className={`a26-page-header a26-page-header--${variant} ${className}`.trim()}
      {...props}
    >
      <div className="a26-page-header__main">
        <div className="a26-page-header__identity">
          {eyebrow && (
            <div className="a26-page-header__eyebrow">
              {eyebrow}
            </div>
          )}
          <div className="a26-page-header__title-row">
            <TitleTag className="a26-page-header__title">
              {title}
            </TitleTag>
            {status && (
              <div className="a26-page-header__status">
                {status}
              </div>
            )}
          </div>
          {description && (
            <p className="a26-page-header__description">
              {description}
            </p>
          )}
        </div>
        {(primaryAction || secondaryAction) && (
          <div className="a26-page-header__actions">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
      {children && (
        <div className="a26-page-header__extra">
          {children}
        </div>
      )}
    </header>
  );
}
