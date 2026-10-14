import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, MapPin, Clock, Wifi, Volume2, PenLine, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, priceLabel, isOpenNow } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import CafeQR from "@/components/CafeQR";
import { Stars } from "@/components/Stars";
import AISummary from "@/components/AISummary";
import MenuSection from "@/components/MenuSection";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";

function Breakdown({ cafe }) {
  const total = cafe.review_count || 1;
  return (
    <div className="grid gap-8 rounded-2xl border border-[#E4DACF] bg-white p-6 sm:grid-cols-2" data-testid="rating-breakdown">
      <div>
        <p className="font-display text-6xl font-bold">{cafe.rating_avg?.toFixed(1)}</p>
        <Stars value={cafe.rating_avg} />
        <p className="mt-1 text-sm text-[#6E5E55]">{cafe.review_count} reviews</p>
        <div className="mt-4 space-y-1.5">
          {[5, 4, 3, 2, 1].map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="w-3">{s}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F3EBE1]"><div className="h-full rounded-full bg-[#E09F3E]" style={{ width: `${((cafe.rating_dist?.[s] || 0) / total) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {Object.entries(cafe.sub_ratings || {}).map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between text-sm"><span className="capitalize">{k}</span><span className="font-mono-x font-semibold">{v}</span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F3EBE1]"><div className="h-full rounded-full bg-[#C86D3B]" style={{ width: `${(v / 5) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CafeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, favIds, toggleFav } = useAuth();
  const [params, setParams] = useSearchParams();
  const [qrOpen, setQrOpen] = useState(false);
  const [cafe, setCafe] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sort, setSort] = useState("newest");
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(() => {
    api.get(`/cafes/${id}`).then(({ data }) => setCafe(data)).catch(() => nav("/explore"));
    api.get(`/cafes/${id}/reviews?sort=${sort}`).then(({ data }) => setReviews(data));
  }, [id, sort, nav]);
  useEffect(load, [load]);
  useEffect(() => {
    if (params.get("review") !== "1" || user === null || !cafe) return;
    if (!user) { toast.info("Log in to leave your review"); nav(`/login?next=${encodeURIComponent(`/cafe/${id}?review=1`)}`); return; }
    setFormOpen(true);
    setParams({}, { replace: true });
  }, [params, user, cafe, id, nav, setParams]);

  if (!cafe) return <div className="mx-auto max-w-7xl px-8 py-20"><div className="h-96 animate-pulse rounded-3xl bg-[#F3EBE1]" /></div>;

  const mine = user && reviews.find((r) => r.user_id === user.id);
  const open = isOpenNow(cafe.open_time, cafe.close_time);
  const saved = favIds.includes(cafe.id);
  const imgs = cafe.images?.length ? cafe.images : [""];

  const writeReview = () => { if (!user) { toast.error("Log in to write a review"); return nav(`/login?next=${encodeURIComponent(`/cafe/${id}?review=1`)}`); } setFormOpen(true); };
  const fav = async () => { if (!user) return toast.error("Log in to save cafes"); const s = await toggleFav(cafe.id); toast.success(s ? "Saved to your list" : "Removed"); };
  const share = () => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); };

  const stats = [
    [Clock, open ? "Open now" : "Closed", `${cafe.open_time} – ${cafe.close_time}`],
    [Wifi, cafe.wifi_speed ? `${cafe.wifi_speed} Mbps` : "No wifi", "Wifi"],
    [Volume2, cafe.noise_level, "Noise"],
    [MapPin, cafe.neighborhood, "Area"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <div className="grid h-[320px] grid-cols-4 grid-rows-2 gap-3 overflow-hidden rounded-[1.75rem] md:h-[460px]" data-testid="cafe-gallery">
        <img src={imgs[0]} alt={cafe.name} className="col-span-4 row-span-2 h-full w-full object-cover md:col-span-2" />
        {imgs.slice(1, 4).map((s, i) => <img key={i} src={s} alt="" className={`hidden h-full w-full object-cover md:block ${i === 0 ? "col-span-2" : ""}`} />)}
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">{cafe.neighborhood} · {priceLabel(cafe.price_level)} · {cafe.cuisines.join(" / ")}</p>
          <h1 className="font-display mt-3 text-4xl font-bold sm:text-6xl" data-testid="cafe-detail-name">{cafe.name}</h1>
          <p className="font-display mt-2 text-xl italic text-[#6E5E55]">{cafe.tagline}</p>
          <div className="mt-4 flex items-center gap-3"><Stars value={cafe.rating_avg} /><span className="font-semibold" data-testid="cafe-detail-rating">{cafe.rating_avg?.toFixed(1)}</span><span className="text-sm text-[#6E5E55]">({cafe.review_count} reviews)</span></div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E4DACF] bg-[#E4DACF] sm:grid-cols-4">
            {stats.map(([I, v, l]) => (
              <div key={l} className="bg-white p-4"><I size={16} className={l === "Opening" || (I === Clock && open) ? "text-[#6B8E23]" : "text-[#C86D3B]"} /><p className="mt-2 font-semibold">{v}</p><p className="text-xs text-[#6E5E55]">{l}</p></div>
            ))}
          </div>

          <Tabs defaultValue="overview" className="mt-10">
            <TabsList className="bg-[#F3EBE1]">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="menu" data-testid="tab-menu">Menu</TabsTrigger>
              <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews ({cafe.review_count})</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6 space-y-8">
              <p className="text-lg leading-relaxed text-[#2C221E]">{cafe.description}</p>
              <AISummary cafeId={cafe.id} reviewCount={cafe.review_count} />
              <div>
                <p className="font-mono-x mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">Amenities & vibe</p>
                <div className="flex flex-wrap gap-2">
                  {cafe.amenities.map((a) => <span key={a} className="rounded-full border border-[#E4DACF] bg-white px-3 py-1.5 text-sm">{a}</span>)}
                  {cafe.vibes.map((a) => <span key={a} className="rounded-full bg-[#2C221E] px-3 py-1.5 text-sm text-[#FAF6F0]">{a}</span>)}
                </div>
              </div>
              <p className="flex items-center gap-2 text-sm text-[#6E5E55]"><MapPin size={15} />{cafe.address}</p>
            </TabsContent>
            <TabsContent value="menu" className="mt-6"><MenuSection menu={cafe.menu} /></TabsContent>
            <TabsContent value="reviews" className="mt-6 space-y-8">
              <Breakdown cafe={cafe} />
              <ReviewList reviews={reviews} sort={sort} setSort={setSort} onChange={load} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-3 rounded-2xl border border-[#E4DACF] bg-white p-6">
            <button onClick={writeReview} data-testid="cafe-detail-write-review-btn" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#C86D3B] py-3 font-semibold text-white transition-colors hover:bg-[#A85528]">
              <PenLine size={16} />{mine ? "Edit your review" : "Write a review"}
            </button>
            <button onClick={fav} data-testid="cafe-detail-save-btn" className="flex w-full items-center justify-center gap-2 rounded-full border border-[#2C221E] py-3 font-semibold transition-colors hover:bg-[#2C221E] hover:text-white">
              <Heart size={16} className={saved ? "fill-[#C86D3B] text-[#C86D3B]" : ""} />{saved ? "Saved" : "Save cafe"}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setQrOpen(true)} data-testid="cafe-detail-qr-btn" className="flex items-center justify-center gap-2 rounded-full bg-[#F3EBE1] py-2.5 text-sm font-medium hover:bg-[#E4DACF]"><QrCode size={14} />Review QR</button>
              <button onClick={share} data-testid="cafe-detail-share-btn" className="flex items-center justify-center gap-2 rounded-full bg-[#F3EBE1] py-2.5 text-sm font-medium hover:bg-[#E4DACF]"><Share2 size={14} />Share</button>
            </div>
          </div>
        </aside>
      </div>
      <CafeQR cafe={cafe} open={qrOpen} onOpenChange={setQrOpen} />
      {formOpen && <ReviewForm open={formOpen} onOpenChange={setFormOpen} cafeId={cafe.id} initial={mine && { rating: mine.rating, coffee: mine.coffee, ambience: mine.ambience, service: mine.service, value: mine.value, visit_type: mine.visit_type, text: mine.text }} onSaved={load} />}
    </div>
  );
}
