import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const CompareCtx = createContext(null);

export function CompareProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem("bs_compare") || "[]"));
  useEffect(() => localStorage.setItem("bs_compare", JSON.stringify(items)), [items]);

  const toggle = (cafe) => {
    setItems((cur) => {
      if (cur.find((c) => c.id === cafe.id)) return cur.filter((c) => c.id !== cafe.id);
      if (cur.length >= 3) { toast.error("You can compare up to 3 cafes"); return cur; }
      toast.success(`${cafe.name} added to compare`);
      return [...cur, { id: cafe.id, name: cafe.name, image: cafe.images?.[0] }];
    });
  };

  return (
    <CompareCtx.Provider value={{ items, toggle, clear: () => setItems([]), has: (id) => items.some((c) => c.id === id) }}>
      {children}
    </CompareCtx.Provider>
  );
}

export const useCompare = () => useContext(CompareCtx);
