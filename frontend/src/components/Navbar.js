import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Coffee, Heart, LogOut, Menu, Sparkles, Shuffle, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { api, openBarista } from "@/lib/api";

const links = [
  { to: "/explore", label: "Explore", id: "nav-explore-link" },
  { to: "/explore?sort=rating&min_rating=4", label: "Top Rated", id: "nav-top-rated-link" },
  { to: "/compare", label: "Compare", id: "nav-compare-link" },
  { to: "/favorites", label: "Saved", id: "nav-favorites-link" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);

  const surprise = async () => { const { data } = await api.get("/cafes/random"); nav(`/cafe/${data.id}`); };

  const linkCls = ({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? "text-[#C86D3B]" : "text-[#2C221E] hover:text-[#C86D3B]"}`;

  const authArea = user ? (
    <div className="flex items-center gap-3">
      {user.role === "admin" && (
        <Link to="/admin" data-testid="nav-admin-link" className="flex items-center gap-1 text-sm font-medium text-[#2C221E] hover:text-[#C86D3B]"><Shield size={15} />Admin</Link>
      )}
      <span className="hidden text-sm text-[#6E5E55] lg:inline" data-testid="nav-user-name">Hi, {user.name.split(" ")[0]}</span>
      <button onClick={logout} data-testid="nav-logout-button" className="rounded-full p-2 text-[#2C221E] transition-colors hover:bg-[#F3EBE1]" title="Log out"><LogOut size={17} /></button>
    </div>
  ) : (
    <Link to="/login" data-testid="nav-login-button" className="rounded-full border border-[#2C221E] px-5 py-2 text-sm font-semibold text-[#2C221E] transition-colors duration-200 hover:bg-[#2C221E] hover:text-[#FAF6F0]">Log in</Link>
  );

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-200 ${scrolled ? "border-[#E4DACF] bg-[#FAF6F0]/90" : "border-transparent bg-[#FAF6F0]/60"}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-5 md:px-8">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2C221E] text-[#FAF6F0]"><Coffee size={18} /></span>
          <span className="font-display text-xl font-bold tracking-tight">BrewSpot</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => <NavLink key={l.id} to={l.to} data-testid={l.id} className={l.to.includes("?") ? linkCls({ isActive: false }) : linkCls} end>{l.label}</NavLink>)}
        </nav>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <button onClick={surprise} data-testid="nav-surprise-button" title="Surprise me" className="rounded-full p-2 text-[#2C221E] transition-colors hover:bg-[#F3EBE1]"><Shuffle size={17} /></button>
          <button onClick={() => openBarista()} data-testid="nav-ai-barista-button" className="flex items-center gap-2 rounded-full bg-[#C86D3B] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#A85528]">
            <Sparkles size={15} /> Ask Bean
          </button>
          {authArea}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <button className="ml-auto md:hidden" data-testid="nav-mobile-menu-button"><Menu /></button>
          </SheetTrigger>
          <SheetContent className="bg-[#FAF6F0]">
            <div className="mt-10 flex flex-col gap-5">
              {links.map((l) => <NavLink key={l.id} to={l.to} className="font-display text-2xl" data-testid={`mobile-${l.id}`}>{l.label}</NavLink>)}
              <button onClick={surprise} className="flex items-center gap-2 text-left font-display text-2xl" data-testid="mobile-surprise-button"><Shuffle size={20} />Surprise me</button>
              <button onClick={() => openBarista()} className="flex items-center gap-2 text-left font-display text-2xl text-[#C86D3B]" data-testid="mobile-barista-button"><Sparkles size={20} />Ask Bean</button>
              <div className="pt-4">{authArea}</div>
              {user && <Link to="/favorites" className="flex items-center gap-2 text-sm"><Heart size={15} />My saved cafes</Link>}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
