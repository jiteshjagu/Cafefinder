import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const reviewUrl = (id) => `${window.location.origin}/cafe/${id}?review=1`;

export default function CafeQR({ cafe, open, onOpenChange }) {
  const ref = useRef(null);
  if (!cafe) return null;
  const url = reviewUrl(cafe.id);
  const download = () => {
    const a = document.createElement("a");
    a.href = ref.current.querySelector("canvas").toDataURL("image/png");
    a.download = `${cafe.name.replace(/\W+/g, "-")}-review-qr.png`;
    a.click();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[#EFE6D8] bg-white sm:max-w-sm" data-testid="cafe-qr-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Scan to review</DialogTitle>
          <DialogDescription>Print this at the table or counter. Customers scan it and go straight to the review form for {cafe.name}.</DialogDescription>
        </DialogHeader>
        <div ref={ref} className="mx-auto rounded-3xl border-4 border-[#2C221E] bg-white p-5 text-center" data-testid="cafe-qr-code">
          <QRCodeCanvas value={url} size={200} fgColor="#2C221E" level="M" />
          <p className="font-display mt-3 text-lg font-bold italic">{cafe.name}</p>
          <p className="font-mono-x text-[10px] uppercase tracking-[0.25em] text-[#9E7738]">Rate your visit</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={download} data-testid="cafe-qr-download-btn" className="flex items-center justify-center gap-2 rounded-full bg-[#2C221E] py-2.5 text-sm font-semibold text-white hover:bg-[#D3B683] hover:text-[#2C221E]"><Download size={14} />Download</button>
          <button onClick={() => { navigator.clipboard?.writeText(url); toast.success("Review link copied"); }} data-testid="cafe-qr-copy-btn" className="flex items-center justify-center gap-2 rounded-full border border-[#2C221E] py-2.5 text-sm font-semibold hover:bg-[#FAF7F2]"><Copy size={14} />Copy link</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
