import { useState } from "react";

export function useNum(initial = "") {
  const [v, setV] = useState(initial);
  const n = Number.parseFloat(v);
  const ok = Number.isFinite(n);
  return { v, setV, n: ok ? n : NaN, ok };
}
