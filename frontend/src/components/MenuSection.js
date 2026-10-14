import { useState } from "react";
import { Leaf, Award } from "lucide-react";

export default function MenuSection({ menu }) {
  const cats = [...new Set(menu.map((m) => m.category))];
  const [cat, setCat] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
  const items = menu.filter((m) => (cat === "All" || m.category === cat) && (!vegOnly || m.veg));

  return (
    <div data-testid="menu-section">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {["All", ...cats].map((c) => (
          <button key={c} onClick={() => setCat(c)} data-testid={`menu-cat-${c}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors duration-200 ${cat === c ? "bg-[#2C221E] text-white" : "border border-[#EFE6D8] bg-white text-[#2C221E] hover:bg-[#FAF7F2]"}`}>{c}</button>
        ))}
        <button onClick={() => setVegOnly(!vegOnly)} data-testid="menu-veg-toggle"
          className={`ml-auto flex shrink-0 items-center gap-1 rounded-full border px-4 py-2 text-sm transition-colors ${vegOnly ? "border-[#6B8E23] bg-[#6B8E23] text-white" : "border-[#EFE6D8] text-[#6B8E23]"}`}><Leaf size={14} />Veg only</button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((m) => (
          <div key={m.id} className="flex items-start justify-between gap-4 rounded-xl border border-[#EFE6D8] bg-white p-4 transition-colors duration-200 hover:border-[#D3B683]" data-testid={`menu-item-${m.id}`}>
            <div>
              <p className="flex items-center gap-2 font-semibold">
                {m.name}
                {m.signature && <span className="inline-flex items-center gap-1 rounded-full bg-[#D3B683]/25 px-2 py-0.5 text-[10px] font-bold uppercase text-[#8C6839]"><Award size={10} />Signature</span>}
                {m.veg && <Leaf size={12} className="text-[#6B8E23]" />}
              </p>
              <p className="mt-1 text-sm text-[#6E5E55]">{m.description}</p>
              <p className="font-mono-x mt-2 text-[10px] uppercase tracking-wider text-[#A89A8E]">{m.category}</p>
            </div>
            <span className="font-mono-x font-bold text-[#9E7738]">₹{Number(m.price).toFixed(2)}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-[#6E5E55]">No items match.</p>}
      </div>
    </div>
  );
}
