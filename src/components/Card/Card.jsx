export default function Card({ as: Component = "section", className = "", children }) {
  return (
    <Component className={`min-w-0 rounded-[18px] border border-white/10 bg-gradient-to-br from-graphite/75 to-blackDeep/80 p-5 shadow-premium backdrop-blur-xl transition duration-200 hover:border-agedGold/25 hover:shadow-glow ${className}`}>
      {children}
    </Component>
  );
}
