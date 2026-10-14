import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, Camera, ImageUp } from "lucide-react";
import { toast } from "sonner";

function routeFromText(text) {
  try {
    const u = new URL(text);
    const m = u.pathname.match(/\/cafe\/([^/]+)/);
    return m ? `/cafe/${m[1]}?review=1` : null;
  } catch { return null; }
}

export default function ScanQR() {
  const nav = useNavigate();
  const scanner = useRef(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");

  const handle = (text) => {
    const to = routeFromText(text);
    if (!to) { toast.error("That QR isn't a Café Reviews code"); return false; }
    toast.success("Cafe found! Opening review...");
    nav(to);
    return true;
  };

  const stop = async () => {
    if (scanner.current?.isScanning) await scanner.current.stop().catch(() => {});
    setRunning(false);
  };

  const start = async () => {
    setErr("");
    try {
      scanner.current = scanner.current || new Html5Qrcode("qr-reader");
      await scanner.current.start({ facingMode: "environment" }, { fps: 10, qrbox: 230 }, async (text) => { if (handle(text)) await stop(); }, () => {});
      setRunning(true);
    } catch {
      setErr("Camera unavailable. Allow camera access or upload a photo of the QR code instead.");
    }
  };

  const fromFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await stop();
    try {
      scanner.current = scanner.current || new Html5Qrcode("qr-reader");
      handle(await scanner.current.scanFile(file, false));
    } catch { toast.error("No QR code found in that image"); }
    e.target.value = "";
  };

  useEffect(() => () => { if (scanner.current?.isScanning) scanner.current.stop().catch(() => {}); }, []);

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 md:grid-cols-2 md:px-8">
      <div className="rise">
        <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">QR review</p>
        <h1 className="font-display mt-3 text-5xl font-bold leading-tight">Scan the table code. <em className="font-medium text-[#C86D3B]">Rate in seconds.</em></h1>
        <p className="mt-4 text-lg text-[#6E5E55]">Every café has its own QR code. Scan it here, or with your phone camera, and the review form opens straight away.</p>
        <ol className="mt-8 space-y-4">
          {["Find the Café Reviews QR on your table or receipt", "Point your camera at it, or upload a photo", "Rate it & snap photos of your food and table — done"].map((s, i) => (
            <li key={s} className="flex items-center gap-4"><span className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2C221E] text-lg text-[#FAF6F0]">{i + 1}</span><span>{s}</span></li>
          ))}
        </ol>
      </div>
      <div className="rounded-[2rem] border border-[#E4DACF] bg-white p-6">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#2C221E]">
          <div id="qr-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" data-testid="qr-reader" />
          {!running && (
            <div className="absolute inset-0 grid place-items-center text-[#FAF6F0]">
              <div className="text-center"><ScanLine size={64} className="mx-auto text-[#E09F3E]" /><p className="mt-3 text-sm text-[#A89A8E]">Camera preview appears here</p></div>
            </div>
          )}
        </div>
        {err && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" data-testid="qr-error">{err}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={running ? stop : start} data-testid="qr-start-camera-btn" className="flex items-center justify-center gap-2 rounded-full bg-[#C86D3B] py-3 font-semibold text-white hover:bg-[#A85528]">
            <Camera size={16} />{running ? "Stop camera" : "Start camera"}
          </button>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#2C221E] py-3 font-semibold hover:bg-[#F3EBE1]" data-testid="qr-upload-label">
            <ImageUp size={16} />Upload photo
            <input type="file" accept="image/*" className="hidden" onChange={fromFile} data-testid="qr-upload-input" />
          </label>
        </div>
      </div>
    </div>
  );
}
