const variants = {
  primary: "border-agedGold/50 bg-gradient-to-br from-[#f0daa0] via-agedGold to-[#8d7438] text-[#11100b]",
  teal: "border-techTeal/50 bg-gradient-to-br from-[#78efea] via-techTeal to-[#197f85] text-[#031112]",
  outline: "border-white/25 bg-white/[0.02] text-clinicalWhite hover:border-agedGold/50",
  ghost: "border-white/10 bg-white/[0.03] text-clinicalWhite hover:border-techTeal/40",
  danger: "border-red-300/25 bg-red-400/10 text-red-100"
};

export default function Button({ as: Component = "button", variant = "ghost", className = "", children, ...props }) {
  const defaultType = Component === "button" && !props.type ? { type: "button" } : {};

  return (
    <Component
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-bold transition duration-200 hover:-translate-y-0.5 hover:shadow-glow disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...defaultType}
      {...props}
    >
      {children}
    </Component>
  );
}
