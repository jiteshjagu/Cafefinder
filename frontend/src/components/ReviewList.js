import { ThumbsUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Stars } from "@/components/Stars";
import { useAuth } from "@/context/AuthContext";
import { api, formatError } from "@/lib/api";

function ReviewItem({ r, onChange }) {
  const { user } = useAuth();
  const helpful = async () => {
    if (!user) return toast.error("Log in to vote");
    await api.post(`/reviews/${r.id}/helpful`);
    onChange();
  };
  const remove = async () => {
    try { await api.delete(`/reviews/${r.id}`); toast.success("Review deleted"); onChange(); } catch (e) { toast.error(formatError(e)); }
  };
  const canDelete = user && (user.id === r.user_id || user.role === "admin");
  return (
    <article className="border-b border-[#E4DACF] py-6" data-testid={`review-item-${r.id}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#2C221E] font-display text-[#FAF6F0]">{r.user_name?.[0]}</span>
        <div className="flex-1">
          <p className="font-semibold">{r.user_name}</p>
          <p className="text-xs text-[#6E5E55]">{r.visit_type} visit · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
        </div>
        <Stars value={r.rating} size={15} />
      </div>
      <p className="mt-3 leading-relaxed text-[#2C221E]">{r.text}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-[#6E5E55]">
        <span>Coffee {r.coffee} · Ambience {r.ambience} · Service {r.service} · Value {r.value}</span>
        <button onClick={helpful} data-testid={`review-helpful-${r.id}`} className="ml-auto flex items-center gap-1 hover:text-[#C86D3B]"><ThumbsUp size={13} />Helpful ({r.helpful_count})</button>
        {canDelete && <button onClick={remove} data-testid={`review-delete-${r.id}`} className="hover:text-red-600"><Trash2 size={13} /></button>}
      </div>
    </article>
  );
}

export default function ReviewList({ reviews, sort, setSort, onChange }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {[["newest", "Newest"], ["helpful", "Most helpful"], ["highest", "Highest"], ["lowest", "Lowest"]].map(([v, l]) => (
          <button key={v} onClick={() => setSort(v)} data-testid={`review-sort-${v}`}
            className={`rounded-full px-3 py-1 text-xs ${sort === v ? "bg-[#2C221E] text-white" : "bg-white text-[#2C221E]"}`}>{l}</button>
        ))}
      </div>
      {reviews.length === 0 && <p className="py-10 text-center text-[#6E5E55]" data-testid="reviews-empty">No reviews yet.</p>}
      {reviews.map((r) => <ReviewItem key={r.id} r={r} onChange={onChange} />)}
    </div>
  );
}
