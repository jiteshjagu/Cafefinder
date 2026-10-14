import { Star } from "lucide-react";

export function Stars({ value = 0, size = 16, className = "" }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? "fill-[#E09F3E] text-[#E09F3E]" : "text-[#E4DACF]"} />
      ))}
    </div>
  );
}

export function StarInput({ value, onChange, size = 28, testid }) {
  return (
    <div className="flex items-center gap-1" data-testid={testid}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button type="button" key={i} onClick={() => onChange(i)} data-testid={`${testid}-${i}`}
          className="transition-transform duration-150 hover:scale-125">
          <Star size={size} className={i <= value ? "fill-[#E09F3E] text-[#E09F3E]" : "text-[#D8CABB]"} />
        </button>
      ))}
    </div>
  );
}
