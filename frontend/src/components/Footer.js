import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="mt-24 bg-[#2C221E] text-[#F5EFE8]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-12 md:px-8">
        <div className="md:col-span-6">
          <Logo light />
          <p className="font-display mt-4 max-w-md text-3xl italic leading-snug text-[#E09F3E]">"Life happens, coffee helps."</p>
        </div>
        <div className="md:col-span-3">
          <p className="font-mono-x text-xs uppercase tracking-[0.18em] text-[#A89A8E]">Discover</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link to="/explore" className="hover:text-[#E09F3E]">All cafes</Link>
            <Link to="/explore?amenity=Wifi,Power%20Outlets" className="hover:text-[#E09F3E]">Work-friendly</Link>
            <Link to="/explore?cuisine=Vegan" className="hover:text-[#E09F3E]">Vegan</Link>
            <Link to="/explore?price=1" className="hover:text-[#E09F3E]">Budget picks</Link>
          </div>
        </div>
        <div className="md:col-span-3">
          <p className="font-mono-x text-xs uppercase tracking-[0.18em] text-[#A89A8E]">You</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link to="/favorites" className="hover:text-[#E09F3E]">Saved cafes</Link>
            <Link to="/reviews" className="hover:text-[#E09F3E]">Reviews</Link>
            <Link to="/scan" className="hover:text-[#E09F3E]">Scan to review</Link>
            <Link to="/login" className="hover:text-[#E09F3E]">Log in</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[#362A23] py-6 text-center text-xs text-[#A89A8E]">© {new Date().getFullYear()} Café’ Reviews · Brewed with care</div>
    </footer>
  );
}
