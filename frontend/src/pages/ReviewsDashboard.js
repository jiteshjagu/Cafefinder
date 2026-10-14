import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Star, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/lib/api";
import { Stars } from "@/components/Stars";
import PhotoStrip from "@/components/PhotoStrip";

const STAR_COLORS = ["#8F6A2C", "#A67C3D", "#D3B683", "#C2A36E", "#6B8E23"];

function Kpi({ icon: I, label, value, testid }) {
  return (
    <div className="rounded-2xl border border-[#EFE6D8] bg-white p-6 shadow-sm" data-testid={testid}>
      <I size={20} className="text-[#9E7738]" />
      <p className="font-display mt-4 text-4xl font-bold">{value}</p>
      <p className="text-sm text-[#6E5E55]">{label}</p>
    </div>
  );
}

export default function ReviewsDashboard() {
  const [d, setD] = useState(null);
  const [rating, setRating] = useState(0);
  const [cafeId, setCafeId] = useState("");
  const [feed, setFeed] = useState([]);

  useEffect(() => { api.get("/reviews/dashboard").then(({ data }) => setD(data)); }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (rating) p.set("rating", rating);
    if (cafeId) p.set("cafe_id", cafeId);
    api.get(`/reviews?${p}`).then(({ data }) => setFeed(data));
  }, [rating, cafeId]);

  if (!d) return <div className="mx-auto max-w-7xl px-8 py-20"><div className="h-96 animate-pulse rounded-3xl bg-[#FAF7F2]" /></div>;
  const dist = [1, 2, 3, 4, 5].map((s) => ({ star: `${s}★`, count: d.distribution[String(s)] || 0 }));

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#9E7738]">Community pulse</p>
      <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">Reviews</h1>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={MessageSquare} label="Total reviews" value={d.total} testid="kpi-total-reviews" />
        <Kpi icon={Star} label="Average rating" value={d.avg_rating} testid="kpi-avg-rating" />
        <Kpi icon={TrendingUp} label="Last 30 days" value={d.last_30_days} testid="kpi-last-30" />
        <Kpi icon={Users} label="Reviewers" value={d.reviewers} testid="kpi-reviewers" />
      </div>

      <div className="mt-8">
        <div className="rounded-2xl border border-[#EFE6D8] bg-white p-6 shadow-sm" data-testid="chart-distribution">
          <p className="font-display text-xl font-semibold">Rating distribution</p>
          <div className="mt-4 h-60">
            <ResponsiveContainer>
              <BarChart data={dist}><XAxis dataKey="star" tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} /><Tooltip cursor={{ fill: "#FAF7F2" }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>{dist.map((_, i) => <Cell key={i} fill={STAR_COLORS[i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#EFE6D8] bg-white p-6 shadow-sm lg:col-span-4" data-testid="cafe-leaderboard">
          <p className="font-display text-xl font-semibold">Cafe leaderboard</p>
          {d.leaderboard.map((c, i) => (
            <Link key={c.id} to={`/cafe/${c.id}`} className="flex items-center gap-3 border-b border-[#EFE6D8] py-3 hover:text-[#9E7738]" data-testid={`leaderboard-${c.id}`}>
              <span className="font-display w-6 text-xl font-bold text-[#9E7738]">{i + 1}</span>
              <img src={c.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
              <span className="flex-1 truncate font-semibold">{c.name}</span>
              <span className="text-sm">{c.rating_avg}★ <span className="text-[#6E5E55]">({c.review_count})</span></span>
            </Link>
          ))}
          <p className="font-display mt-6 text-lg font-semibold">Average by aspect</p>
          {Object.entries(d.aspects).map(([k, v]) => (
            <div key={k} className="mt-3">
              <div className="flex justify-between text-sm"><span className="capitalize">{k}</span><span className="font-mono-x font-semibold">{v}</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#FAF7F2]"><div className="h-full rounded-full bg-[#D3B683]" style={{ width: `${(v / 5) * 100}%` }} /></div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#EFE6D8] bg-white p-6 shadow-sm lg:col-span-8" data-testid="reviews-feed">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display mr-auto text-xl font-semibold">All reviews ({feed.length})</p>
            <select value={cafeId} onChange={(e) => setCafeId(e.target.value)} data-testid="reviews-filter-cafe" className="rounded-full border border-[#EFE6D8] bg-white px-3 py-1.5 text-xs">
              <option value="">All cafes</option>
              {d.leaderboard.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {[0, 5, 4, 3, 2, 1].map((r) => (
              <button key={r} onClick={() => setRating(r)} data-testid={`reviews-filter-rating-${r}`}
                className={`rounded-full px-3 py-1.5 text-xs ${rating === r ? "bg-[#2C221E] text-white" : "border border-[#EFE6D8] bg-white text-[#2C221E]"}`}>{r ? `${r}★` : "All"}</button>
            ))}
          </div>
          <div className="mt-4 max-h-[640px] overflow-y-auto pr-2">
            {feed.map((r) => (
              <Link key={r.id} to={`/cafe/${r.cafe_id}`} className="block border-b border-[#EFE6D8] py-4 transition-colors hover:bg-[#FAF7F2]" data-testid={`feed-review-${r.id}`}>
                <div className="flex items-center gap-3">
                  <span className="font-display grid h-9 w-9 place-items-center rounded-full bg-[#2C221E] text-white">{r.user_name?.[0]}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{r.user_name} <span className="font-normal text-[#6E5E55]">on</span> <span className="text-[#9E7738]">{r.cafe_name}</span></p>
                    <p className="text-xs text-[#6E5E55]">{r.visit_type} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                  </div>
                  <Stars value={r.rating} size={13} />
                </div>
                <p className="mt-2 text-sm leading-relaxed">{r.text}</p>
                <PhotoStrip photos={r.photos} size="h-16 w-16" testid={`feed-photos-${r.id}`} />
              </Link>
            ))}
            {feed.length === 0 && <p className="py-10 text-center text-sm text-[#6E5E55]" data-testid="reviews-feed-empty">No reviews match.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
