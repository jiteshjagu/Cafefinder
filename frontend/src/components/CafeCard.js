import { Link } from "react-router-dom";
import { Heart, Star, GitCompare, Wifi } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCompare } from "@/context/CompareContext";
import { priceLabel, isOpenNow } from "@/lib/api";

export default function CafeCard({ cafe, big = false, index = 0 }) {
  const { user, favIds, toggleFav } = useAuth();
  const compare = useCompare();
  const saved = favIds.includes(cafe.id);
  const open = isOpenNow(cafe.open_time, cafe.close_time);

  const onFav = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Log in to save cafes");
    const s = await toggleFav(cafe.id);
    toast.success(s ? `Saved ${cafe.name}` : `Removed ${cafe.name}`);
  };

  return (
    <Link to={`/cafe/${cafe.id}`} data-testid={`cafe-card-link-${cafe.id}`} style={{ animationDelay: `${index * 60}ms` }}
      className={`rise group relative flex flex-col overflow-hidden rounded-2xl border border-[#E4DACF] bg-white transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#C86D3B]/50 hover:shadow-[0_20px_40px_-20px_rgba(44,34,30,0.35)] ${big ? "md:col-span-2 md:row-span-2" : ""}`}>
      <div className={`relative w-full overflow-hidden bg-[#F3EBE1] ${big ? "h-64 md:h-[26rem]" : "h-52"}`}>
        <img src={cafe.images?.[0]} alt={cafe.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C221E]/60 via-transparent to-transparent" />
        <span className="font-mono-x absolute right-3 top-3 rounded-full bg-[#2C221E]/80 px-3 py-1 text-xs font-semibold text-[#FAF6F0] backdrop-blur-sm">{priceLabel(cafe.price_level)}</span>
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${open ? "bg-[#6B8E23]/90 text-white" : "bg-white/80 text-[#6E5E55]"}`} data-testid={`cafe-open-status-${cafe.id}`}>
          {open ? "Open now" : "Closed"}
        </span>
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-[#2C221E] shadow-sm">
          <Star size={13} className="fill-[#E09F3E] text-[#E09F3E]" /> {cafe.rating_avg?.toFixed(1)} <span className="font-normal text-[#6E5E55]">({cafe.review_count})</span>
        </div>
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button onClick={(e) => { e.preventDefault(); compare.toggle(cafe); }} data-testid={`cafe-compare-toggle-${cafe.id}`} title="Compare"
            className={`rounded-full p-2 backdrop-blur-sm transition-colors duration-200 ${compare.has(cafe.id) ? "bg-[#2C221E] text-white" : "bg-white/90 text-[#2C221E] hover:bg-white"}`}>
            <GitCompare size={15} />
          </button>
          <button onClick={onFav} data-testid={`cafe-favorite-toggle-${cafe.id}`} title="Save"
            className="rounded-full bg-white/90 p-2 backdrop-blur-sm transition-transform duration-200 hover:scale-110">
            <Heart size={15} className={saved ? "fill-[#C86D3B] text-[#C86D3B]" : "text-[#2C221E]"} />
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono-x text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">{cafe.neighborhood}</p>
        <h3 className={`font-display mt-1 font-semibold text-[#2C221E] ${big ? "text-3xl" : "text-xl"}`}>{cafe.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[#6E5E55]">{cafe.tagline}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          {cafe.cuisines?.slice(0, 3).map((c) => (
            <span key={c} className="rounded-full bg-[#F3EBE1] px-2.5 py-1 text-[11px] font-medium text-[#2C221E]">{c}</span>
          ))}
          {cafe.wifi_speed > 0 && <span className="ml-auto flex items-center gap-1 text-[11px] text-[#6E5E55]"><Wifi size={12} />{cafe.wifi_speed}Mbps</span>}
        </div>
      </div>
    </Link>
  );
}
