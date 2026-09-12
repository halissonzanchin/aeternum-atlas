export default function A26FeatureShell({
  header,
  toolbar,
  children,
  variant = "standard", // "standard" | "catalog" | "tool" | "canvas"
  maxWidth = "1440px",
  className = "",
  ...props
}) {
  const isCanvas = variant === "canvas";
  const shellStyle = isCanvas
    ? { maxWidth: "100%", width: "100%" }
    : maxWidth
      ? { maxWidth }
      : undefined;

  return (
    <div
      className={`a26-feature-shell a26-feature-shell--${variant} ${className}`.trim()}
      style={shellStyle}
      {...props}
    >
      {header && (
        <div className="a26-feature-shell__header-slot">
          {header}
        </div>
      )}
      {toolbar && (
        <div className="a26-feature-shell__toolbar-slot">
          {toolbar}
        </div>
      )}
      <main className="a26-feature-shell__body">
        {children}
      </main>
    </div>
  );
}
