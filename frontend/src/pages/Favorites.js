import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import CafeCard from "@/components/CafeCard";
import { Stars } from "@/components/Stars";

export default function Favorites() {
  const { favIds, user } = useAuth();
  const [cafes, setCafes] = useState(null);
  const [reviews, setReviews] = useState([]);
  useEffect(() => { api.get("/favorites").then(({ data }) => setCafes(data.cafes)); }, [favIds]);
  useEffect(() => { api.get("/me/reviews").then(({ data }) => setReviews(data)); }, []);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#9E7738]">Your corner</p>
      <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">{user.name.split(" ")[0]}'s saved cafes</h1>
      {cafes && cafes.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-[#EFE6D8] p-16 text-center" data-testid="favorites-empty">
          <p className="font-display text-2xl">Nothing saved yet.</p>
          <Link to="/explore" className="mt-4 inline-block rounded-full bg-[#D3B683] px-6 py-3 font-semibold text-[#2C221E] transition-colors hover:bg-[#C2A36E]">Explore cafes</Link>
        </div>
      )}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="favorites-grid">
        {cafes?.map((c, i) => <CafeCard key={c.id} cafe={c} index={i} />)}
      </div>

      <h2 className="font-display mt-20 text-3xl font-semibold">Your reviews ({reviews.length})</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2" data-testid="my-reviews-list">
        {reviews.map((r) => (
          <Link key={r.id} to={`/cafe/${r.cafe_id}`} className="rounded-2xl border border-[#EFE6D8] bg-white p-5 transition-colors hover:border-[#D3B683]">
            <Stars value={r.rating} size={14} />
            <p className="mt-2 line-clamp-3 text-sm">{r.text}</p>
          </Link>
        ))}
        {reviews.length === 0 && <p className="text-sm text-[#6E5E55]">You haven't reviewed any cafes yet.</p>}
      </div>
    </div>
  );
}
