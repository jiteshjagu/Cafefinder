import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { photoUrl } from "@/components/PhotoPicker";

export default function PhotoStrip({ photos = [], size = "h-24 w-24", testid = "review-photos" }) {
  const [open, setOpen] = useState(null);
  if (!photos.length) return null;
  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2" data-testid={testid}>
        {photos.map((id) => (
          <button key={id} type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(id); }} data-testid={`photo-thumb-${id}`}
            className={`${size} overflow-hidden rounded-xl border border-[#EFE6D8] transition-transform duration-200 hover:scale-105`}>
            <img src={photoUrl(id)} alt="Review" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent aria-describedby={undefined} className="max-w-3xl border-none bg-[#2C221E] p-2" data-testid="photo-lightbox">
          <DialogTitle className="sr-only">Review photo</DialogTitle>
          {open && <img src={photoUrl(open)} alt="Review" className="max-h-[80vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
