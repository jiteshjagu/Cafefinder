import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Coffee, MessageSquare, Users, Star, QrCode } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { api, priceLabel, formatError } from "@/lib/api";
import CafeForm from "@/components/CafeForm";
import CafeQR from "@/components/CafeQR";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [cafes, setCafes] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [qr, setQr] = useState(null);

  const load = useCallback(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data));
    api.get("/cafes?sort=name").then(({ data }) => setCafes(data));
  }, []);
  useEffect(load, [load]);

  const edit = async (id) => { const { data } = await api.get(`/cafes/${id}`); setEditing(data); };
  const remove = async () => {
    try { await api.delete(`/admin/cafes/${deleting.id}`); toast.success("Cafe deleted"); load(); } catch (e) { toast.error(formatError(e)); }
    setDeleting(null);
  };

  const cards = stats ? [[Coffee, "Cafes", stats.cafes], [MessageSquare, "Reviews", stats.reviews], [Users, "Users", stats.users], [Star, "Avg rating", stats.avg_rating]] : [];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">Back of house</p>
          <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">Admin dashboard</h1>
        </div>
        <button onClick={() => setEditing(null)} data-testid="admin-add-cafe-btn" className="flex items-center gap-2 rounded-full bg-[#C86D3B] px-5 py-3 font-semibold text-white hover:bg-[#A85528]"><Plus size={16} />Add cafe</button>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4" data-testid="admin-stats">
        {cards.map(([I, l, v]) => (
          <div key={l} className="rounded-2xl border border-[#E4DACF] bg-white p-6"><I className="text-[#C86D3B]" size={20} /><p className="font-display mt-4 text-4xl font-bold">{v}</p><p className="text-sm text-[#6E5E55]">{l}</p></div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="overflow-x-auto rounded-2xl border border-[#E4DACF] bg-white lg:col-span-8">
          <table className="w-full min-w-[560px] text-sm" data-testid="admin-cafe-table">
            <thead className="bg-[#F3EBE1] text-left text-xs uppercase tracking-wider text-[#6E5E55]">
              <tr><th className="p-4">Cafe</th><th className="p-4">Price</th><th className="p-4">Rating</th><th className="p-4">Menu</th><th className="p-4" /></tr>
            </thead>
            <tbody>
              {cafes.map((c) => (
                <tr key={c.id} className="border-t border-[#F3EBE1]" data-testid={`admin-cafe-row-${c.id}`}>
                  <td className="p-4"><Link to={`/cafe/${c.id}`} className="flex items-center gap-3 hover:text-[#C86D3B]"><img src={c.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="font-semibold">{c.name}</span></Link></td>
                  <td className="font-mono-x p-4">{priceLabel(c.price_level)}</td>
                  <td className="p-4">{c.rating_avg} ({c.review_count})</td>
                  <td className="p-4 text-[#6E5E55]">{c.cuisines.slice(0, 2).join(", ")}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setQr(c)} data-testid={`admin-qr-cafe-${c.id}`} title="Review QR" className="rounded-full p-2 hover:bg-[#F3EBE1]"><QrCode size={15} /></button>
                    <button onClick={() => edit(c.id)} data-testid={`admin-edit-cafe-${c.id}`} className="rounded-full p-2 hover:bg-[#F3EBE1]"><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(c)} data-testid={`admin-delete-cafe-${c.id}`} className="rounded-full p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-[#E4DACF] bg-white p-6 lg:col-span-4" data-testid="admin-recent-reviews">
          <p className="font-display text-xl font-semibold">Latest reviews</p>
          {stats?.recent_reviews.map((r) => (
            <Link key={r.id} to={`/cafe/${r.cafe_id}`} className="block border-b border-[#F3EBE1] py-3 text-sm hover:text-[#C86D3B]">
              <p className="font-semibold">{r.user_name} · {r.rating}★</p><p className="line-clamp-2 text-[#6E5E55]">{r.text}</p>
            </Link>
          ))}
        </div>
      </div>

      {editing !== undefined && <CafeForm cafe={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />}
      <CafeQR cafe={qr} open={!!qr} onOpenChange={(o) => !o && setQr(null)} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle><AlertDialogDescription>This removes the cafe and all its reviews permanently.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel data-testid="admin-delete-cancel">Cancel</AlertDialogCancel><AlertDialogAction onClick={remove} data-testid="admin-delete-confirm" className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
