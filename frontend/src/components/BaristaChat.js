import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X, Send, RotateCcw, Star, Coffee } from "lucide-react";
import { API, api, priceLabel } from "@/lib/api";

const PROMPTS = [
  "A quiet cafe with fast wifi to work for 4 hours",
  "Romantic evening spot with desserts",
  "Cheap breakfast with great pastries",
  "Vegan brunch where I can bring my dog",
];

const newSession = () => { const s = crypto.randomUUID(); localStorage.setItem("bs_chat", s); return s; };

function MiniCafe({ cafe }) {
  if (!cafe) return null;
  return (
    <Link to={`/cafe/${cafe.id}`} data-testid={`barista-rec-${cafe.id}`} className="my-2 flex items-center gap-3 rounded-xl border border-[#E4DACF] bg-white p-2 transition-colors duration-200 hover:border-[#C86D3B]">
      <img src={cafe.images?.[0]} alt="" className="h-14 w-14 rounded-lg object-cover" />
      <div className="min-w-0">
        <p className="font-display truncate font-semibold">{cafe.name}</p>
        <p className="flex items-center gap-1 text-xs text-[#6E5E55]"><Star size={11} className="fill-[#E09F3E] text-[#E09F3E]" />{cafe.rating_avg} · {priceLabel(cafe.price_level)} · {cafe.neighborhood}</p>
      </div>
    </Link>
  );
}

function Bubble({ m, cafes }) {
  if (m.role === "user") return <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#2C221E] px-4 py-2.5 text-sm text-[#FAF6F0]">{m.content}</div>;
  const parts = m.content.split(/(\[\[cafe:[^\]]+\]\])/g);
  return (
    <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-[#F3EBE1] px-4 py-3 text-sm leading-relaxed text-[#2C221E]">
      {parts.map((p, i) => {
        const mm = p.match(/\[\[cafe:([^\]]+)\]\]/);
        return mm ? <MiniCafe key={i} cafe={cafes[mm[1].trim()]} /> : <span key={i} className="whitespace-pre-wrap">{p.replace(/\*\*/g, "")}</span>;
      })}
      {!m.content && <span className="inline-flex gap-1">{[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C86D3B]" style={{ animationDelay: `${d * 120}ms` }} />)}</span>}
    </div>
  );
}

export default function BaristaChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [cafes, setCafes] = useState({});
  const [session, setSession] = useState(() => localStorage.getItem("bs_chat") || newSession());
  const endRef = useRef(null);

  useEffect(() => {
    const h = (e) => { setOpen(true); if (e.detail) send(e.detail); };
    window.addEventListener("open-barista", h);
    return () => window.removeEventListener("open-barista", h);
  });

  useEffect(() => {
    if (!open) return;
    api.get("/cafes").then(({ data }) => setCafes(Object.fromEntries(data.map((c) => [c.id, c]))));
    api.get(`/barista/history/${session}`).then(({ data }) => setMsgs((cur) => (cur.length ? cur : data)));
  }, [open, session]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
    const append = (t) => setMsgs((m) => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + t }; return c; });
    try {
      const token = localStorage.getItem("bs_token");
      const res = await fetch(`${API}/barista/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ session_id: session, message: msg }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop();
        events.forEach((ev) => {
          if (!ev.startsWith("data: ")) return;
          const d = JSON.parse(ev.slice(6));
          if (d.delta) append(d.delta);
          if (d.error) append(d.error);
        });
      }
    } catch {
      append("Sorry, I spilled the coffee. Please try again.");
    }
    setBusy(false);
  };

  const reset = () => { setSession(newSession()); setMsgs([]); };

  return (
    <>
      <button onClick={() => setOpen(true)} data-testid="ai-barista-chat-trigger"
        className={`fixed bottom-6 right-6 z-40 grid h-16 w-16 place-items-center rounded-full bg-[#2C221E] text-[#FAF6F0] shadow-[0_15px_35px_-10px_rgba(44,34,30,.6)] transition-transform duration-300 hover:scale-110 ${open ? "scale-0" : ""}`}>
        <span className="steam relative"><span style={{ left: 4 }} /><span style={{ left: 12, animationDelay: ".8s" }} /></span>
        <Coffee size={26} />
      </button>
      <div className={`fixed inset-0 z-50 bg-[#2C221E]/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(false)} />
      <aside data-testid="ai-barista-panel"
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col bg-[#FAF6F0] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] sm:w-[440px] ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center gap-3 border-b border-[#E4DACF] bg-[#2C221E] px-5 py-4 text-[#FAF6F0]">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#C86D3B]"><Sparkles size={18} /></span>
          <div className="flex-1">
            <p className="font-display text-lg font-semibold">Bean, your AI Barista</p>
            <p className="text-xs text-[#A89A8E]">Tell me your mood, I'll find your cafe</p>
          </div>
          <button onClick={reset} data-testid="ai-barista-reset-btn" title="New chat" className="rounded-full p-2 hover:bg-white/10"><RotateCcw size={16} /></button>
          <button onClick={() => setOpen(false)} data-testid="ai-barista-close-btn" className="rounded-full p-2 hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-5" data-testid="ai-barista-messages">
          {msgs.length === 0 && (
            <div className="rise">
              <p className="font-display text-3xl leading-tight">What are you <em className="text-[#C86D3B]">craving</em> today?</p>
              <p className="mt-2 text-sm text-[#6E5E55]">Describe the vibe, budget or food — I know every cafe in town.</p>
              <div className="mt-6 flex flex-col gap-2">
                {PROMPTS.map((p, i) => (
                  <button key={p} onClick={() => send(p)} data-testid={`ai-barista-prompt-${i}`}
                    className="rounded-xl border border-[#E4DACF] bg-white px-4 py-3 text-left text-sm transition-colors duration-200 hover:border-[#C86D3B] hover:text-[#C86D3B]">{p}</button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => <Bubble key={i} m={m} cafes={cafes} />)}
          <div ref={endRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-[#E4DACF] p-4">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. cozy spot for a rainy afternoon..." data-testid="ai-barista-input"
            className="flex-1 rounded-full border border-[#E4DACF] bg-white px-5 py-3 text-sm outline-none transition-colors focus:border-[#C86D3B]" />
          <button disabled={busy} data-testid="ai-barista-send-btn" className="grid h-12 w-12 place-items-center rounded-full bg-[#C86D3B] text-white transition-colors hover:bg-[#A85528] disabled:opacity-50"><Send size={17} /></button>
        </form>
      </aside>
    </>
  );
}
