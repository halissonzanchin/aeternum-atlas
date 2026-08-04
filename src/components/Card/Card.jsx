export default function Card({
  as: Component = "section",
  className = "",
  children,
  interactive = false,
  depth = "standard",
  ...props
}) {
  return (
    <Component
      className={`atlas-crystal-surface a26-legacy-card min-w-0 rounded-[18px] border border-white/10 bg-gradient-to-br from-graphite/75 to-blackDeep/80 p-5 shadow-premium transition duration-200 ${interactive ? "atlas-crystal-surface--interactive" : ""} ${className}`}
      data-crystal-depth={depth}
      data-a26-adapter=""
      data-a26-material="opaque"
      data-a26-blur="false"
      {...props}
    >
      {children}
    </Component>
  );
}
