import { Link } from "react-router-dom";
import { X, GitCompare } from "lucide-react";
import { useCompare } from "@/context/CompareContext";

export default function CompareBar() {
  const { items, toggle, clear } = useCompare();
  if (!items.length) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#E4DACF] bg-white/95 py-2 pl-3 pr-2 shadow-xl backdrop-blur-md" data-testid="compare-bar">
      {items.map((c) => (
        <div key={c.id} className="relative">
          <img src={c.image} alt={c.name} title={c.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
          <button onClick={() => toggle(c)} className="absolute -right-1 -top-1 rounded-full bg-[#2C221E] p-0.5 text-white" data-testid={`compare-bar-remove-${c.id}`}><X size={10} /></button>
        </div>
      ))}
      <button onClick={clear} className="px-2 text-xs text-[#6E5E55] hover:text-[#2C221E]" data-testid="compare-bar-clear">Clear</button>
      <Link to="/compare" data-testid="compare-bar-go" className="flex items-center gap-2 rounded-full bg-[#2C221E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C86D3B]">
        <GitCompare size={14} /> Compare ({items.length})
      </Link>
    </div>
  );
}
