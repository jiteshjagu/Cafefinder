import { Coffee } from "lucide-react";

export default function Logo({ light = false }) {
  return (
    <span className="group flex items-center gap-2.5" data-testid="brand-logo">
      <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[#2C221E] text-[#FAF6F0] ring-2 ring-[#C86D3B]/40 ring-offset-2 ring-offset-transparent transition-transform duration-300 group-hover:rotate-[-12deg]">
        <Coffee size={18} />
      </span>
      <span className="flex items-baseline leading-none">
        <span className={`font-display text-[1.7rem] font-bold italic tracking-tight ${light ? "text-[#FAF6F0]" : "text-[#2C221E]"}`}>Café</span>
        <span className="font-display mx-0.5 text-[1.7rem] font-bold text-[#C86D3B]">’</span>
        <span className={`font-mono-x ml-1 rounded-md px-1.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] ${light ? "bg-[#C86D3B] text-white" : "bg-[#C86D3B] text-white"}`}>Reviews</span>
      </span>
    </span>
  );
}
