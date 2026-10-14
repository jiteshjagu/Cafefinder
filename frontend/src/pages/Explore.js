import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import CafeCard from "@/components/CafeCard";

const Chip = ({ active, onClick, children, testid }) => (
  <button type="button" onClick={onClick} data-testid={testid}
    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${active ? "border-[#2C221E] bg-[#2C221E] text-white" : "border-[#E4DACF] bg-white text-[#2C221E] hover:border-[#C86D3B]"}`}>
    {children}
  </button>
);

function Filters({ params, set, meta }) {
  const list = (k) => (params.get(k) || "").split(",").filter(Boolean);
  const toggle = (k, v) => { const l = list(k); set(k, (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]).join(",")); };
  const Group = ({ title, children }) => (
    <div className="border-b border-[#E4DACF] py-6 first:pt-0">
      <p className="font-mono-x mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
  return (
    <div data-testid="filter-panel">
      <Group title="Price">{[1, 2, 3, 4].map((p) => <Chip key={p} testid={`filter-price-${p}`} active={list("price").includes(String(p))} onClick={() => toggle("price", String(p))}>{"$".repeat(p)}</Chip>)}</Group>
      <Group title="Minimum rating">{[0, 3, 4, 4.5].map((r) => <Chip key={r} testid={`filter-min-rating-${r}`} active={Number(params.get("min_rating") || 0) === r} onClick={() => set("min_rating", r ? String(r) : "")}>{r ? `${r}+ ★` : "Any"}</Chip>)}</Group>
      <Group title="Food type">{meta.cuisines.map((c) => <Chip key={c} testid={`filter-cuisine-${c}`} active={list("cuisine").includes(c)} onClick={() => toggle("cuisine", c)}>{c}</Chip>)}</Group>
      <Group title="Amenities">{meta.amenities.map((a) => <Chip key={a} testid={`filter-amenity-${a}`} active={list("amenity").includes(a)} onClick={() => toggle("amenity", a)}>{a}</Chip>)}</Group>
      <Group title="Neighbourhood">{meta.neighborhoods.map((n) => <Chip key={n} testid={`filter-neighborhood-${n}`} active={params.get("neighborhood") === n} onClick={() => set("neighborhood", params.get("neighborhood") === n ? "" : n)}>{n}</Chip>)}</Group>
    </div>
  );
}

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [cafes, setCafes] = useState(null);
  const [meta, setMeta] = useState({ cuisines: [], amenities: [], neighborhoods: [] });
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => { api.get("/cafes/meta").then(({ data }) => setMeta(data)); }, []);
  useEffect(() => {
    setCafes(null);
    api.get(`/cafes?${params.toString()}`).then(({ data }) => setCafes(data));
  }, [params]);

  const set = (k, v) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p); };
  const activeCount = ["price", "cuisine", "amenity", "neighborhood", "min_rating"].filter((k) => params.get(k)).length;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">Explore</p>
      <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">Every cafe, <em className="font-medium">your way</em>.</h1>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={(e) => { e.preventDefault(); set("q", q); }} className="flex flex-1 items-center gap-2 rounded-full border border-[#E4DACF] bg-white px-4">
          <Search size={18} className="text-[#6E5E55]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cafes, dishes, vibes..." data-testid="explore-search-input" className="flex-1 bg-transparent py-3 outline-none" />
          {q && <button type="button" onClick={() => { setQ(""); set("q", ""); }} data-testid="explore-search-clear"><X size={16} /></button>}
        </form>
        <Select value={params.get("sort") || "rating"} onValueChange={(v) => set("sort", v)}>
          <SelectTrigger className="h-12 w-full rounded-full bg-white sm:w-52" data-testid="explore-sort-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[["rating", "Highest rated"], ["reviews", "Most reviewed"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"], ["newest", "Newest"], ["name", "A–Z"]].map(([v, l]) => (
              <SelectItem key={v} value={v} data-testid={`sort-option-${v}`}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#E4DACF] bg-white px-5 text-sm font-semibold lg:hidden" data-testid="explore-mobile-filter-button"><SlidersHorizontal size={16} />Filters {activeCount > 0 && `(${activeCount})`}</button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto bg-[#FAF6F0] pt-12"><Filters params={params} set={set} meta={meta} /></SheetContent>
        </Sheet>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            <div className="mb-6 flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold"><SlidersHorizontal size={16} />Filters</p>
              {activeCount > 0 && <button onClick={() => setParams(params.get("q") ? { q: params.get("q") } : {})} data-testid="filter-clear-all" className="text-xs text-[#C86D3B] hover:underline">Clear all</button>}
            </div>
            <Filters params={params} set={set} meta={meta} />
          </div>
        </aside>
        <section className="lg:col-span-9">
          <p className="mb-5 text-sm text-[#6E5E55]" data-testid="explore-result-count">{cafes ? `${cafes.length} cafe${cafes.length === 1 ? "" : "s"} found` : "Brewing results..."}</p>
          {cafes && cafes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E4DACF] p-16 text-center" data-testid="explore-empty-state">
              <p className="font-display text-2xl">No cafes match those filters.</p>
              <p className="mt-2 text-sm text-[#6E5E55]">Try removing a filter or searching something else.</p>
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {!cafes && [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-[#F3EBE1]" />)}
            {cafes?.map((c, i) => <CafeCard key={c.id} cafe={c} index={i} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
