import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine } from "../types";

const STORAGE_KEY = "medway-stamps:cart";

interface CartContextValue {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  removeLine: (stampId: string) => void;
  clear: () => void;
  totalPence: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadInitialCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadInitialCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // localStorage unavailable (private mode etc.) — cart just won't persist.
    }
  }, [lines]);

  // Stamps are unique items (quantity is almost always 1), so adding an
  // already-present line just replaces it rather than incrementing.
  function addLine(line: CartLine) {
    setLines((prev) => [...prev.filter((l) => l.stampId !== line.stampId), line]);
  }

  function removeLine(stampId: string) {
    setLines((prev) => prev.filter((l) => l.stampId !== stampId));
  }

  function clear() {
    setLines([]);
  }

  const totalPence = useMemo(
    () => lines.reduce((sum, l) => sum + l.pricePence * l.quantity, 0),
    [lines],
  );

  return (
    <CartContext.Provider value={{ lines, addLine, removeLine, clear, totalPence }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
