import { useEffect, useState } from "react";
import { Sparkles, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { api, formatError } from "@/lib/api";

export default function AISummary({ cafeId, reviewCount }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true); setErr("");
    api.get(`/cafes/${cafeId}/summary`).then(({ data }) => setData(data)).catch((e) => setErr(formatError(e))).finally(() => setLoading(false));
  };
  useEffect(load, [cafeId, reviewCount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-2xl border border-[#D3B683]/40 bg-gradient-to-br from-[#FAF7F2] to-white p-6 shadow-sm" data-testid="ai-summary-box">
      <span className="font-mono-x mb-3 inline-flex items-center gap-2 rounded-full bg-[#D3B683]/25 px-3 py-1 text-xs font-bold text-[#8C6839]"><Sparkles size={12} />AI REVIEW SUMMARY</span>
      {loading && <div className="space-y-2"><div className="h-4 w-full animate-pulse rounded bg-[#EFE6D8]" /><div className="h-4 w-4/5 animate-pulse rounded bg-[#EFE6D8]" /><p className="text-xs text-[#6E5E55]">Reading every review...</p></div>}
      {err && <p className="text-sm text-[#6E5E55]">{err} <button onClick={load} className="ml-2 inline-flex items-center gap-1 text-[#9E7738]" data-testid="ai-summary-retry"><RefreshCw size={12} />Retry</button></p>}
      {data && !loading && (
        <div>
          <p className="font-display text-lg leading-relaxed" data-testid="ai-summary-text">{data.summary}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {data.pros?.length > 0 && <div>{data.pros.map((p) => <p key={p} className="flex items-start gap-2 py-1 text-sm"><ThumbsUp size={14} className="mt-0.5 shrink-0 text-[#6B8E23]" />{p}</p>)}</div>}
            {data.cons?.length > 0 && <div>{data.cons.map((p) => <p key={p} className="flex items-start gap-2 py-1 text-sm"><ThumbsDown size={14} className="mt-0.5 shrink-0 text-[#A67C3D]" />{p}</p>)}</div>}
          </div>
          {data.best_for?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{data.best_for.map((b) => <span key={b} className="rounded-full bg-[#2C221E] px-3 py-1 text-xs text-white">Best for: {b}</span>)}</div>}
        </div>
      )}
    </div>
  );
}
