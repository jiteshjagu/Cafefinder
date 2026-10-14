import { Coffee } from "lucide-react";

export default function Logo({ light = false }) {
  return (
    <span className="group flex items-center gap-2.5" data-testid="brand-logo">
      <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[#2C221E] text-white ring-2 ring-[#D3B683]/60 ring-offset-2 ring-offset-transparent transition-transform duration-300 group-hover:rotate-[-12deg]">
        <Coffee size={18} />
      </span>
      <span className="flex items-baseline leading-none">
        <span className={`font-display text-[1.7rem] font-bold italic tracking-tight ${light ? "text-white" : "text-[#2C221E]"}`}>Café</span>
        <span className="font-display mx-0.5 text-[1.7rem] font-bold text-[#D3B683]">’</span>
        <span className="font-mono-x ml-1 rounded-md bg-[#D3B683] px-1.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#2C221E]">Reviews</span>
      </span>
    </span>
  );
}
