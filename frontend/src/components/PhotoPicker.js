import { useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api, API, formatError } from "@/lib/api";

export const photoUrl = (id) => `${API}/files/${id}`;
const MAX = 4;

export default function PhotoPicker({ photos, onChange }) {
  const [uploading, setUploading] = useState(0);

  const pick = async (e) => {
    const files = [...(e.target.files || [])].slice(0, MAX - photos.length);
    e.target.value = "";
    if (!files.length) return toast.error(`Up to ${MAX} photos per review`);
    setUploading(files.length);
    const ids = [];
    for (const f of files) {
      try {
        const fd = new FormData();
        fd.append("file", f);
        const { data } = await api.post("/uploads", fd);
        ids.push(data.id);
      } catch (err) { toast.error(formatError(err)); }
      setUploading((n) => n - 1);
    }
    onChange([...photos, ...ids]);
  };

  return (
    <div data-testid="review-photo-picker">
      <p className="mb-2 text-sm font-semibold">Add photos <span className="font-normal text-[#6E5E55]">— your food, drinks or table ({photos.length}/{MAX})</span></p>
      <div className="flex flex-wrap gap-3">
        {photos.map((id) => (
          <div key={id} className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#EFE6D8]" data-testid={`review-photo-preview-${id}`}>
            <img src={photoUrl(id)} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(photos.filter((p) => p !== id))} data-testid={`review-photo-remove-${id}`}
              className="absolute right-1 top-1 rounded-full bg-[#2C221E]/80 p-0.5 text-white"><X size={12} /></button>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`u${i}`} className="grid h-20 w-20 place-items-center rounded-xl bg-[#FAF7F2]"><Loader2 className="animate-spin text-[#D3B683]" size={20} /></div>
        ))}
        {photos.length + uploading < MAX && (
          <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-[#EFE6D8] text-[#6E5E55] transition-colors hover:border-[#D3B683] hover:text-[#9E7738]" data-testid="review-photo-add">
            <span className="flex flex-col items-center text-[10px] font-semibold"><Camera size={20} />Add</span>
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={pick} data-testid="review-photo-input" />
          </label>
        )}
      </div>
    </div>
  );
}
