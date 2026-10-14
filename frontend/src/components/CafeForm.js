import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, formatError } from "@/lib/api";

const EMPTY = { name: "", tagline: "", description: "", neighborhood: "", address: "", price_level: 2, cuisines: [], amenities: [], vibes: [],
  wifi_speed: 0, noise_level: "Moderate", open_time: "08:00", close_time: "20:00", images: [], menu: [] };
const LIST_FIELDS = ["cuisines", "amenities", "vibes", "images"];
const inp = "w-full rounded-lg border border-[#E4DACF] bg-white px-3 py-2 text-sm outline-none focus:border-[#C86D3B]";

export default function CafeForm({ cafe, onClose, onSaved }) {
  const init = cafe ? { ...EMPTY, ...cafe } : EMPTY;
  const [f, setF] = useState({ ...init, ...Object.fromEntries(LIST_FIELDS.map((k) => [k, (init[k] || []).join(k === "images" ? "\n" : ", ")])) });
  const [busy, setBusy] = useState(false);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const updItem = (i, k, v) => upd("menu", f.menu.map((m, j) => (j === i ? { ...m, [k]: v } : m)));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = { ...f, price_level: Number(f.price_level), wifi_speed: Number(f.wifi_speed) || 0,
      ...Object.fromEntries(LIST_FIELDS.map((k) => [k, f[k].split(k === "images" ? "\n" : ",").map((s) => s.trim()).filter(Boolean)])),
      menu: f.menu.map((m) => ({ ...m, price: Number(m.price) || 0 })) };
    try {
      cafe ? await api.put(`/admin/cafes/${cafe.id}`, body) : await api.post("/admin/cafes", body);
      toast.success(cafe ? "Cafe updated" : "Cafe created");
      onSaved();
    } catch (err) { toast.error(formatError(err)); }
    setBusy(false);
  };

  const text = (k, label, props = {}) => (
    <label className="block"><span className="text-xs font-medium text-[#6E5E55]">{label}</span>
      <input value={f[k]} onChange={(e) => upd(k, e.target.value)} className={inp} data-testid={`cafe-form-${k}`} {...props} /></label>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#FAF6F0] sm:max-w-3xl" data-testid="cafe-form-dialog">
        <DialogHeader><DialogTitle className="font-display text-2xl">{cafe ? `Edit ${cafe.name}` : "Add a new cafe"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {text("name", "Name", { required: true })}
            {text("tagline", "Tagline")}
            {text("neighborhood", "Neighbourhood")}
            {text("address", "Address")}
            <label className="block"><span className="text-xs font-medium text-[#6E5E55]">Price level (1-4)</span>
              <select value={f.price_level} onChange={(e) => upd("price_level", e.target.value)} className={inp} data-testid="cafe-form-price_level">{[1, 2, 3, 4].map((p) => <option key={p} value={p}>{"$".repeat(p)}</option>)}</select></label>
            <label className="block"><span className="text-xs font-medium text-[#6E5E55]">Noise level</span>
              <select value={f.noise_level} onChange={(e) => upd("noise_level", e.target.value)} className={inp} data-testid="cafe-form-noise_level">{["Quiet", "Moderate", "Lively"].map((p) => <option key={p}>{p}</option>)}</select></label>
            {text("open_time", "Opens (HH:MM)")}
            {text("close_time", "Closes (HH:MM)")}
            {text("wifi_speed", "Wifi speed (Mbps)", { type: "number" })}
            {text("cuisines", "Food types (comma separated)")}
            {text("amenities", "Amenities (comma separated)")}
            {text("vibes", "Vibes (comma separated)")}
          </div>
          <label className="block"><span className="text-xs font-medium text-[#6E5E55]">Description</span>
            <textarea value={f.description} onChange={(e) => upd("description", e.target.value)} rows={3} className={inp} data-testid="cafe-form-description" /></label>
          <label className="block"><span className="text-xs font-medium text-[#6E5E55]">Image URLs (one per line)</span>
            <textarea value={f.images} onChange={(e) => upd("images", e.target.value)} rows={3} className={inp} data-testid="cafe-form-images" /></label>

          <div>
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold">Menu ({f.menu.length})</p>
              <button type="button" onClick={() => upd("menu", [...f.menu, { category: "Signature Espresso", name: "", description: "", price: 0, veg: true, signature: false }])}
                data-testid="cafe-form-add-menu-item" className="flex items-center gap-1 rounded-full bg-[#2C221E] px-3 py-1.5 text-xs text-white"><Plus size={12} />Add item</button>
            </div>
            <div className="mt-3 space-y-2">
              {f.menu.map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 rounded-lg bg-white p-2" data-testid={`cafe-form-menu-row-${i}`}>
                  <input placeholder="Category" value={m.category} onChange={(e) => updItem(i, "category", e.target.value)} className={`${inp} col-span-6 sm:col-span-3`} data-testid={`menu-row-${i}-category`} />
                  <input placeholder="Name" required value={m.name} onChange={(e) => updItem(i, "name", e.target.value)} className={`${inp} col-span-6 sm:col-span-3`} data-testid={`menu-row-${i}-name`} />
                  <input placeholder="Description" value={m.description} onChange={(e) => updItem(i, "description", e.target.value)} className={`${inp} col-span-8 sm:col-span-3`} data-testid={`menu-row-${i}-description`} />
                  <input placeholder="Price" type="number" step="0.1" value={m.price} onChange={(e) => updItem(i, "price", e.target.value)} className={`${inp} col-span-4 sm:col-span-1`} data-testid={`menu-row-${i}-price`} />
                  <div className="col-span-12 flex items-center gap-3 text-xs sm:col-span-2">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={m.veg} onChange={(e) => updItem(i, "veg", e.target.checked)} />Veg</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={m.signature} onChange={(e) => updItem(i, "signature", e.target.checked)} />Sig</label>
                    <button type="button" onClick={() => upd("menu", f.menu.filter((_, j) => j !== i))} className="ml-auto text-red-600" data-testid={`menu-row-${i}-delete`}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button disabled={busy} data-testid="cafe-form-submit" className="w-full rounded-full bg-[#C86D3B] py-3 font-semibold text-white hover:bg-[#A85528] disabled:opacity-60">{busy ? "Saving..." : "Save cafe"}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
