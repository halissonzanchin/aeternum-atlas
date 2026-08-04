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
      className={`atlas-crystal-surface min-w-0 rounded-[18px] border border-white/10 bg-gradient-to-br from-graphite/75 to-blackDeep/80 p-5 shadow-premium backdrop-blur-xl transition duration-200 ${interactive ? "atlas-crystal-surface--interactive" : ""} ${className}`}
      data-crystal-depth={depth}
      {...props}
    >
      {children}
    </Component>
  );
}
