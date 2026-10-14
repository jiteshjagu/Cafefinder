import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Laptop, Leaf, Croissant, PawPrint, Wallet, ScanLine, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import CafeCard from "@/components/CafeCard";

const HERO = "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1400&q=80";
const HERO2 = "https://images.unsplash.com/photo-1761210719318-3c2164dfa980?w=800&q=80";

const MOODS = [
  { label: "Deep work", icon: Laptop, to: "/explore?amenity=Wifi,Power%20Outlets&sort=rating" },
  { label: "Plant-based", icon: Leaf, to: "/explore?cuisine=Vegan" },
  { label: "Pastry run", icon: Croissant, to: "/explore?cuisine=Bakery" },
  { label: "Pet friendly", icon: PawPrint, to: "/explore?amenity=Pet%20Friendly" },
  { label: "Under $", icon: Wallet, to: "/explore?price=1" },
];

const TICKER = ["Single-origin pour-overs", "Ceremonial matcha", "Cardamom buns", "Espresso martinis", "Churros con chocolate", "Nitro cold brew", "Afternoon tea towers", "Lavender oat lattes"];

export default function Home() {
  const [q, setQ] = useState("");
  const [stats, setStats] = useState(null);
  const nav = useNavigate();
  useEffect(() => { api.get("/stats").then(({ data }) => setStats(data)); }, []);

  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 md:grid-cols-12 md:px-8 md:pt-20">
        <div className="md:col-span-7">
          <p className="rise font-mono-x text-xs font-semibold uppercase tracking-[0.2em] text-[#C86D3B]">Café reviews · Ratings · Recommendations</p>
          <h1 className="rise font-display mt-5 text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
            Find the cafe that <em className="font-medium text-[#C86D3B]">fits your mood</em>.
          </h1>
          <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-[#6E5E55]" style={{ animationDelay: "160ms" }}>
            Search by price, food and rating. Read honest reviews, browse menus, and scan a table QR to leave your own review in seconds.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); nav(`/explore?q=${encodeURIComponent(q)}`); }} style={{ animationDelay: "240ms" }}
            className="rise mt-10 flex max-w-xl items-center gap-2 rounded-full border border-[#E4DACF] bg-white p-2 shadow-[0_20px_50px_-25px_rgba(44,34,30,.4)]">
            <Search className="ml-3 text-[#6E5E55]" size={20} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cafe, dish, neighbourhood..." data-testid="hero-search-input"
              className="flex-1 bg-transparent px-2 py-3 text-base outline-none" />
            <button data-testid="hero-search-button" className="rounded-full bg-[#2C221E] px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#C86D3B]">Search</button>
          </form>
          <Link to="/scan" data-testid="hero-scan-qr-link" style={{ animationDelay: "300ms" }}
            className="rise mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#C86D3B] hover:underline">
            <ScanLine size={15} /> At a café? Scan its QR to review <ArrowRight size={14} />
          </Link>
          {stats && (
            <div className="rise mt-14 flex gap-10" style={{ animationDelay: "360ms" }} data-testid="home-stats">
              {[["cafes", "Cafes"], ["reviews", "Reviews"], ["users", "Coffee lovers"]].map(([k, l]) => (
                <div key={k}><p className="font-display text-4xl font-bold">{stats[k]}</p><p className="font-mono-x text-[10px] uppercase tracking-[0.18em] text-[#6E5E55]">{l}</p></div>
              ))}
            </div>
          )}
        </div>
        <div className="relative md:col-span-5">
          <div className="rise relative h-[440px] overflow-hidden rounded-[2rem] md:h-[560px]" style={{ animationDelay: "200ms" }}>
            <img src={HERO} alt="Cozy cafe" className="h-full w-full object-cover" />
          </div>
          <div className="rise absolute -bottom-8 -left-6 w-48 overflow-hidden rounded-2xl border-4 border-[#FAF6F0] shadow-xl md:-left-12 md:w-56" style={{ animationDelay: "450ms" }}>
            <img src={HERO2} alt="Latte" className="h-40 w-full object-cover md:h-48" />
          </div>
          <div className="rise absolute right-4 top-4 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md" style={{ animationDelay: "550ms" }}>
            <p className="font-mono-x text-[10px] uppercase tracking-[0.18em] text-[#C86D3B]">Now brewing</p>
            <p className="font-display text-lg font-semibold">Velvet Flat White</p>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-[#E4DACF] bg-[#2C221E] py-4 text-[#FAF6F0]">
        <div className="marquee flex w-max gap-10 whitespace-nowrap">
          {[...TICKER, ...TICKER].map((t, i) => <span key={i} className="font-display text-xl italic">{t} <span className="ml-10 text-[#C86D3B]">✦</span></span>)}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">Browse by mood</p>
        <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">What's the occasion?</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {MOODS.map((m, i) => (
            <Link key={m.label} to={m.to} data-testid={`mood-chip-${i}`}
              className="group flex flex-col gap-6 rounded-2xl border border-[#E4DACF] bg-white p-5 transition-[transform,border-color,background-color] duration-300 hover:-translate-y-1 hover:border-[#2C221E] hover:bg-[#2C221E] hover:text-[#FAF6F0]">
              <m.icon size={26} className="text-[#C86D3B]" />
              <span className="font-semibold">{m.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">Community favourites</p>
            <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">Highest rated this month</h2>
          </div>
          <Link to="/explore" data-testid="home-view-all-link" className="hidden items-center gap-1 text-sm font-semibold hover:text-[#C86D3B] sm:flex">View all <ArrowRight size={14} /></Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-4 md:grid-rows-2">
          {stats?.top.map((c, i) => <CafeCard key={c.id} cafe={c} big={i === 0} index={i} />)}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-5 md:px-8">
        <div className="grid overflow-hidden rounded-[2rem] bg-[#2C221E] text-[#FAF6F0] md:grid-cols-2">
          <div className="p-10 md:p-16">
            <BarChart3 className="text-[#E09F3E]" />
            <h2 className="font-display mt-6 text-4xl font-semibold leading-tight">See what the whole city is saying.</h2>
            <p className="mt-4 text-[#A89A8E]">Live rating trends, a cafe leaderboard and every fresh review, all in one dashboard.</p>
            <Link to="/reviews" data-testid="home-cta-dashboard-link"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#C86D3B] px-6 py-3 font-semibold transition-colors hover:bg-[#A85528]">Open reviews dashboard <ArrowRight size={16} /></Link>
          </div>
          <img src="https://images.unsplash.com/photo-1551887196-72e32bfc7bf3?w=1200&q=80" alt="Cafe bar" className="h-72 w-full object-cover md:h-full" />
        </div>
      </section>
    </div>
  );
}
