import { useState } from "react";
import { Button } from "@/components/ui/button";
import { How } from "@/components/result";
import { evalCalc, fmtCalc } from "@/lib/survbox/calc";
import { cn } from "@/lib/cn";

type Key = {
  label: string;
  insert?: string;
  shiftLabel?: string;
  shiftInsert?: string;
  run?: "eq" | "ac" | "bs" | "deg" | "2nd" | "ans" | "neg" | "sq" | "inv" | "ee";
  wide?: boolean;
  tone?: "accent" | "muted";
};

const KEYS: Key[][] = [
  [
    { label: "2nd", run: "2nd", tone: "muted" },
    { label: "(", insert: "(" },
    { label: ")", insert: ")" },
    { label: "←", run: "bs", tone: "muted" },
    { label: "AC", run: "ac", tone: "muted" },
  ],
  [
    { label: "sin", insert: "sin(", shiftLabel: "sin⁻¹", shiftInsert: "asin(" },
    { label: "cos", insert: "cos(", shiftLabel: "cos⁻¹", shiftInsert: "acos(" },
    { label: "tan", insert: "tan(", shiftLabel: "tan⁻¹", shiftInsert: "atan(" },
    { label: "π", insert: "pi" },
    { label: "e", insert: "e" },
  ],
  [
    { label: "ln", insert: "ln(", shiftLabel: "eˣ", shiftInsert: "e^" },
    { label: "log", insert: "log(", shiftLabel: "10ˣ", shiftInsert: "10^" },
    { label: "√", insert: "sqrt(" },
    { label: "x²", run: "sq" },
    { label: "^", insert: "^" },
  ],
  [
    { label: "7", insert: "7" },
    { label: "8", insert: "8" },
    { label: "9", insert: "9" },
    { label: "÷", insert: "/" },
    { label: "1/x", run: "inv" },
  ],
  [
    { label: "4", insert: "4" },
    { label: "5", insert: "5" },
    { label: "6", insert: "6" },
    { label: "×", insert: "*" },
    { label: "(−)", run: "neg" },
  ],
  [
    { label: "1", insert: "1" },
    { label: "2", insert: "2" },
    { label: "3", insert: "3" },
    { label: "−", insert: "-" },
    { label: "Ans", run: "ans" },
  ],
  [
    { label: "0", insert: "0" },
    { label: ".", insert: "." },
    { label: "EE", run: "ee" },
    { label: "+", insert: "+" },
    { label: "=", run: "eq", tone: "accent" },
  ],
];

export function ToolCalc() {
  const [expr, setExpr] = useState("");
  const [shown, setShown] = useState("0");
  const [deg, setDeg] = useState(true);
  const [shift, setShift] = useState(false);
  const [ans, setAns] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  function insert(s: string) {
    setErr(null);
    setExpr((e) => {
      const next = e + s;
      setShown(next);
      return next;
    });
    setShift(false);
  }

  function syncShown(next: string) {
    setExpr(next);
    setShown(next || "0");
  }

  function onKey(k: Key) {
    if (k.run === "2nd") {
      setShift((s) => !s);
      return;
    }
    if (k.run === "deg") {
      setDeg((d) => !d);
      return;
    }
    if (k.run === "ac") {
      setExpr("");
      setShown("0");
      setErr(null);
      setShift(false);
      return;
    }
    if (k.run === "bs") {
      setErr(null);
      syncShown(expr.slice(0, -1));
      return;
    }
    if (k.run === "ans") {
      insert("ans");
      return;
    }
    if (k.run === "neg") {
      insert("-");
      return;
    }
    if (k.run === "sq") {
      insert("^2");
      return;
    }
    if (k.run === "inv") {
      insert("^(−1)".replace("−", "-"));
      return;
    }
    if (k.run === "ee") {
      insert("*10^");
      return;
    }
    if (k.run === "eq") {
      const r = evalCalc(expr, deg, ans);
      if (!r.ok) {
        setErr(r.error);
        setShown("Error");
        return;
      }
      setAns(r.value);
      setExpr(fmtCalc(r.value));
      setShown(fmtCalc(r.value));
      setErr(null);
      return;
    }
    const text = shift && k.shiftInsert ? k.shiftInsert : k.insert;
    if (text) insert(text);
  }

  return (
    <div className="grid gap-3">
      <How>
        DEG is the field default. 2nd flips sin / cos / tan to inverse. EE is
        ×10^. Treat it as a pocket slide rule.
      </How>
      <div className="rounded-xl border border-border bg-surface p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Button
            variant={deg ? "primary" : "secondary"}
            className="px-3"
            onClick={() => setDeg((d) => !d)}
          >
            {deg ? "DEG" : "RAD"}
          </Button>
          <p className="font-display text-xs tracking-[0.18em] text-muted uppercase">
            {shift ? "2nd" : "Ans"} {shift ? "" : fmtCalc(ans)}
          </p>
        </div>
        <p className="min-h-8 break-all text-right font-mono text-xs text-muted">{expr || " "}</p>
        <p className="min-h-12 break-all text-right font-mono text-3xl tabular-nums leading-tight text-fg">
          {shown}
        </p>
        {err ? <p className="mt-1 text-right text-xs text-warn">{err}</p> : null}
      </div>
      <div className="grid gap-1.5">
        {KEYS.map((row, i) => (
          <div key={i} className="grid grid-cols-5 gap-1.5">
            {row.map((k) => {
              const label = shift && k.shiftLabel ? k.shiftLabel : k.label;
              return (
                <button
                  key={k.label}
                  type="button"
                  onClick={() => onKey(k)}
                  className={cn(
                    "min-h-11 rounded-md border border-border bg-raised font-mono text-sm text-fg active:scale-[0.98]",
                    k.tone === "accent" && "bg-accent text-accent-fg",
                    k.tone === "muted" && "text-muted",
                    k.run === "2nd" && shift && "bg-accent text-accent-fg",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
