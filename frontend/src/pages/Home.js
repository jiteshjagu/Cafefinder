import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Laptop, Leaf, Croissant, PawPrint, Wallet, ScanLine, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import CafeCard from "@/components/CafeCard";


const MOODS = [
  { label: "Deep work", icon: Laptop, to: "/explore?amenity=Wifi,Power%20Outlets&sort=rating" },
  { label: "Plant-based", icon: Leaf, to: "/explore?cuisine=Vegan" },
  { label: "Pastry run", icon: Croissant, to: "/explore?cuisine=Bakery" },
  { label: "Pet friendly", icon: PawPrint, to: "/explore?amenity=Pet%20Friendly" },
  { label: "₹100–₹200", icon: Wallet, to: "/explore?price=1" },
];

const TICKER = ["Single-origin pour-overs", "Ceremonial matcha", "Cardamom buns", "Espresso martinis", "Churros con chocolate", "Nitro cold brew", "Afternoon tea towers", "Lavender oat lattes"];

export default function Home() {
  const [q, setQ] = useState("");
  const [stats, setStats] = useState(null);
  const nav = useNavigate();
  useEffect(() => { api.get("/stats").then(({ data }) => setStats(data)); }, []);

  return (
    <div className="bg-white">
      <section className="mx-auto flex max-w-4xl flex-col items-center px-5 pb-20 pt-16 text-center md:px-8 md:pt-24">
        <p className="rise font-mono-x text-xs font-semibold uppercase tracking-[0.2em] text-[#9E7738]">Café reviews · Ratings · Recommendations</p>
        <h1 className="rise font-display mt-5 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
          Find the cafe that <em className="font-medium text-[#9E7738]">fits your mood</em>.
        </h1>
        <p className="rise mt-6 max-w-2xl text-lg leading-relaxed text-[#6E5E55]" style={{ animationDelay: "160ms" }}>
          Search by price, food and rating. Read honest reviews, browse menus, and scan a table QR to leave your own review in seconds.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); nav(`/explore?q=${encodeURIComponent(q)}`); }} style={{ animationDelay: "240ms" }}
          className="rise mt-10 flex w-full max-w-xl items-center gap-2 rounded-full border border-[#EFE6D8] bg-white p-2 shadow-[0_20px_50px_-25px_rgba(211,182,131,.35)]">
          <Search className="ml-3 text-[#6E5E55]" size={20} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cafe, dish, neighbourhood..." data-testid="hero-search-input"
            className="flex-1 bg-transparent px-2 py-3 text-base outline-none" />
          <button data-testid="hero-search-button" className="rounded-full bg-[#D3B683] px-6 py-3 text-sm font-semibold text-[#2C221E] transition-colors duration-200 hover:bg-[#C2A36E]">Search</button>
        </form>
        <Link to="/scan" data-testid="hero-scan-qr-link" style={{ animationDelay: "300ms" }}
          className="rise mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#9E7738] hover:underline">
          <ScanLine size={15} /> At a café? Scan its QR to review <ArrowRight size={14} />
        </Link>
        {stats && (
          <div className="rise mt-14 flex justify-center gap-12 sm:gap-16" style={{ animationDelay: "360ms" }} data-testid="home-stats">
            {[["cafes", "Cafes"], ["reviews", "Reviews"], ["users", "Coffee lovers"]].map(([k, l]) => (
              <div key={k}><p className="font-display text-4xl font-bold text-[#2C221E]">{stats[k]}</p><p className="font-mono-x text-[10px] uppercase tracking-[0.18em] text-[#6E5E55]">{l}</p></div>
            ))}
          </div>
        )}
      </section>

      <div className="overflow-hidden border-y border-[#EFE6D8] bg-[#2C221E] py-4 text-white">
        <div className="marquee flex w-max gap-10 whitespace-nowrap">
          {[...TICKER, ...TICKER].map((t, i) => <span key={i} className="font-display text-xl italic">{t} <span className="ml-10 text-[#D3B683]">✦</span></span>)}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#9E7738]">Browse by mood</p>
        <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">What's the occasion?</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {MOODS.map((m, i) => (
            <Link key={m.label} to={m.to} data-testid={`mood-chip-${i}`}
              className="group flex flex-col gap-6 rounded-2xl border border-[#EFE6D8] bg-white p-5 transition-[transform,border-color,background-color] duration-300 hover:-translate-y-1 hover:border-[#D3B683] hover:bg-[#FAF7F2]">
              <m.icon size={26} className="text-[#9E7738] transition-colors group-hover:text-[#2C221E]" />
              <span className="font-semibold text-[#2C221E]">{m.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#9E7738]">Community favourites</p>
            <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">Highest rated this month</h2>
          </div>
          <Link to="/explore" data-testid="home-view-all-link" className="hidden items-center gap-1 text-sm font-semibold text-[#9E7738] hover:underline sm:flex">View all <ArrowRight size={14} /></Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-4 md:grid-rows-2">
          {stats?.top.map((c, i) => <CafeCard key={c.id} cafe={c} big={i === 0} index={i} />)}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-5 pb-20 md:px-8">
        <div className="grid overflow-hidden rounded-[2rem] bg-[#2C221E] text-white md:grid-cols-2">
          <div className="p-10 md:p-16">
            <BarChart3 className="text-[#D3B683]" />
            <h2 className="font-display mt-6 text-4xl font-semibold leading-tight">See what the whole city is saying.</h2>
            <p className="mt-4 text-[#A89A8E]">Live rating trends, a cafe leaderboard and every fresh review, all in one place.</p>
            <Link to="/reviews" data-testid="home-cta-dashboard-link"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#D3B683] px-6 py-3 font-semibold text-[#2C221E] transition-colors hover:bg-[#C2A36E]">Open reviews <ArrowRight size={16} /></Link>
          </div>
          <img src="https://images.unsplash.com/photo-1551887196-72e32bfc7bf3?w=1200&q=80" alt="Cafe bar" className="h-72 w-full object-cover md:h-full" />
        </div>
      </section>
    </div>
  );
}
