import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StarInput } from "@/components/Stars";
import { api, formatError } from "@/lib/api";

const SUBS = [["coffee", "Coffee & food"], ["ambience", "Ambience"], ["service", "Service"], ["value", "Value for money"]];
const VISITS = ["Solo", "Date", "Friends", "Work", "Family"];

export default function ReviewForm({ open, onOpenChange, cafeId, initial, onSaved }) {
  const [f, setF] = useState(initial || { rating: 0, coffee: 4, ambience: 4, service: 4, value: 4, visit_type: "Solo", text: "" });
  const [busy, setBusy] = useState(false);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.rating) return toast.error("Please choose an overall rating");
    setBusy(true);
    try {
      await api.post(`/cafes/${cafeId}/reviews`, f);
      toast.success("Thanks! Your review is live.");
      onSaved();
      onOpenChange(false);
    } catch (err) { toast.error(formatError(err)); }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[90vh] overflow-y-auto bg-[#FAF6F0] sm:max-w-lg" data-testid="review-form-dialog">
        <DialogHeader><DialogTitle className="font-display text-2xl">{initial ? "Update your review" : "Share your experience"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold">Overall rating</p>
            <StarInput value={f.rating} onChange={(v) => upd("rating", v)} testid="review-overall-stars" size={34} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {SUBS.map(([k, l]) => (
              <div key={k}><p className="mb-1 text-xs text-[#6E5E55]">{l}</p><StarInput value={f[k]} onChange={(v) => upd(k, v)} testid={`review-${k}-stars`} size={18} /></div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Visited for</p>
            <div className="flex flex-wrap gap-2">
              {VISITS.map((v) => (
                <button type="button" key={v} onClick={() => upd("visit_type", v)} data-testid={`review-visit-${v}`}
                  className={`rounded-full border px-3 py-1 text-xs ${f.visit_type === v ? "border-[#2C221E] bg-[#2C221E] text-white" : "border-[#E4DACF] bg-white"}`}>{v}</button>
              ))}
            </div>
          </div>
          <textarea value={f.text} onChange={(e) => upd("text", e.target.value)} rows={5} placeholder="What did you order? How was the vibe? (min 10 characters)" data-testid="review-text-input"
            className="w-full rounded-xl border border-[#E4DACF] bg-white p-4 text-sm outline-none focus:border-[#C86D3B]" />
          <button disabled={busy} data-testid="review-submit-button" className="w-full rounded-full bg-[#C86D3B] py-3 font-semibold text-white transition-colors hover:bg-[#A85528] disabled:opacity-60">
            {busy ? "Posting..." : initial ? "Update review" : "Post review"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
