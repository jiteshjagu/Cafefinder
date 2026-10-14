import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, X } from "lucide-react";
import { api, priceLabel, isOpenNow } from "@/lib/api";
import { useCompare } from "@/context/CompareContext";
import { Stars } from "@/components/Stars";

const AMEN = ["Wifi", "Power Outlets", "Quiet", "Outdoor Seating", "Pet Friendly", "Vegan Options", "Late Night"];

export default function Compare() {
  const { items, toggle } = useCompare();
  const [cafes, setCafes] = useState([]);
  useEffect(() => { Promise.all(items.map((c) => api.get(`/cafes/${c.id}`).then((r) => r.data).catch(() => null))).then((r) => setCafes(r.filter(Boolean))); }, [items]);

  if (!items.length) return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center" data-testid="compare-empty">
      <h1 className="font-display text-4xl font-bold">Compare cafes side by side</h1>
      <p className="mt-3 text-[#6E5E55]">Tap the compare icon on up to 3 cafes to see them here.</p>
      <Link to="/explore" className="mt-8 inline-block rounded-full bg-[#C86D3B] px-6 py-3 font-semibold text-white">Pick cafes</Link>
    </div>
  );

  const best = (fn) => Math.max(...cafes.map(fn));
  const rows = [
    ["Rating", (c) => <span className={c.rating_avg === best((x) => x.rating_avg) ? "font-bold text-[#6B8E23]" : ""}>{c.rating_avg} ★</span>],
    ["Reviews", (c) => c.review_count],
    ["Price", (c) => <span className="font-mono-x">{priceLabel(c.price_level)}</span>],
    ["Open now", (c) => (isOpenNow(c.open_time, c.close_time) ? "Yes" : "No") + ` · ${c.open_time}-${c.close_time}`],
    ["Wifi", (c) => <span className={c.wifi_speed === best((x) => x.wifi_speed) && c.wifi_speed ? "font-bold text-[#6B8E23]" : ""}>{c.wifi_speed ? `${c.wifi_speed} Mbps` : "—"}</span>],
    ["Noise", (c) => c.noise_level],
    ["Food", (c) => c.cuisines.join(", ")],
    ...["coffee", "ambience", "service", "value"].map((k) => [k[0].toUpperCase() + k.slice(1), (c) => <span className={c.sub_ratings[k] === best((x) => x.sub_ratings[k]) ? "font-bold text-[#6B8E23]" : ""}>{c.sub_ratings[k]}</span>]),
    ...AMEN.map((a) => [a, (c) => (c.amenities.includes(a) ? <Check size={16} className="text-[#6B8E23]" /> : <Minus size={16} className="text-[#D8CABB]" />)]),
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">Head to head</p>
      <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">Compare cafes</h1>
      <div className="mt-10 overflow-x-auto rounded-2xl border border-[#E4DACF] bg-white" data-testid="compare-table">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="w-40 p-4" />
              {cafes.map((c) => (
                <th key={c.id} className="p-4 text-left align-top">
                  <div className="relative">
                    <img src={c.images[0]} alt="" className="h-32 w-full rounded-xl object-cover" />
                    <button onClick={() => toggle(c)} className="absolute right-2 top-2 rounded-full bg-white p-1" data-testid={`compare-remove-${c.id}`}><X size={12} /></button>
                  </div>
                  <Link to={`/cafe/${c.id}`} className="font-display mt-3 block text-xl font-semibold hover:text-[#C86D3B]">{c.name}</Link>
                  <Stars value={c.rating_avg} size={13} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label} className="border-t border-[#F3EBE1]">
                <td className="font-mono-x p-4 text-[11px] uppercase tracking-wider text-[#6E5E55]">{label}</td>
                {cafes.map((c) => <td key={c.id} className="p-4">{fn(c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
