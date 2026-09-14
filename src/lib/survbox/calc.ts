/** Pocket scientific evaluator. DEG is the field default. */

const FNS = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "ln",
  "log",
  "sqrt",
  "abs",
]);

type Tok =
  | { k: "n"; v: number }
  | { k: "op"; v: string }
  | { k: "fn"; v: string }
  | { k: "u-" }
  | { k: "(" }
  | { k: ")" };

const PREC: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "^": 3,
  "u-": 4,
};

function toRad(x: number, deg: boolean) {
  return deg ? (x * Math.PI) / 180 : x;
}
function fromRad(x: number, deg: boolean) {
  return deg ? (x * 180) / Math.PI : x;
}

function tokenize(src: string, ans: number): Tok[] | string {
  const s = src.replace(/\s+/g, "");
  const out: Tok[] = [];
  let i = 0;
  const isOp = (t: Tok | undefined) => !t || t.k === "op" || t.k === "u-" || t.k === "(" || t.k === "fn";
  while (i < s.length) {
    const c = s[i];
    if ((c >= "0" && c <= "9") || c === ".") {
      const m = s.slice(i).match(/^\d*\.?\d+(?:e[+-]?\d+)?/i);
      if (!m) return "Bad number";
      out.push({ k: "n", v: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[a-z]/i.test(c)) {
      const m = s.slice(i).match(/^[a-z]+/i);
      if (!m) return "Bad name";
      const name = m[0].toLowerCase();
      i += m[0].length;
      if (name === "pi") out.push({ k: "n", v: Math.PI });
      else if (name === "e") out.push({ k: "n", v: Math.E });
      else if (name === "ans") out.push({ k: "n", v: ans });
      else if (FNS.has(name)) out.push({ k: "fn", v: name });
      else return `Unknown ${name}`;
      continue;
    }
    if (c === "(") {
      out.push({ k: "(" });
      i += 1;
      continue;
    }
    if (c === ")") {
      out.push({ k: ")" });
      i += 1;
      continue;
    }
    if (c === "+" || c === "*" || c === "/" || c === "^") {
      out.push({ k: "op", v: c });
      i += 1;
      continue;
    }
    if (c === "-") {
      out.push(isOp(out[out.length - 1]) ? { k: "u-" } : { k: "op", v: "-" });
      i += 1;
      continue;
    }
    return `Bad '${c}'`;
  }
  return out;
}

function implicits(toks: Tok[]): Tok[] {
  const out: Tok[] = [];
  for (const t of toks) {
    const prev = out[out.length - 1];
    const left = prev && (prev.k === "n" || prev.k === ")");
    const right = t.k === "n" || t.k === "fn" || t.k === "(";
    if (left && right) out.push({ k: "op", v: "*" });
    out.push(t);
  }
  return out;
}

function toRpn(toks: Tok[]): Tok[] | string {
  const out: Tok[] = [];
  const st: Tok[] = [];
  for (const t of toks) {
    if (t.k === "n") out.push(t);
    else if (t.k === "fn" || t.k === "u-") st.push(t);
    else if (t.k === "op") {
      while (st.length) {
        const top = st[st.length - 1];
        if (top.k === "fn" || top.k === "u-") {
          out.push(st.pop()!);
          continue;
        }
        if (top.k === "op" && (PREC[top.v] > PREC[t.v] || (PREC[top.v] === PREC[t.v] && t.v !== "^"))) {
          out.push(st.pop()!);
          continue;
        }
        break;
      }
      st.push(t);
    } else if (t.k === "(") st.push(t);
    else if (t.k === ")") {
      while (st.length && st[st.length - 1].k !== "(") out.push(st.pop()!);
      if (!st.length) return "Mismatched ( )";
      st.pop();
      if (st.length && (st[st.length - 1].k === "fn" || st[st.length - 1].k === "u-")) out.push(st.pop()!);
    }
  }
  while (st.length) {
    const t = st.pop()!;
    if (t.k === "(" || t.k === ")") return "Mismatched ( )";
    out.push(t);
  }
  return out;
}

function applyFn(name: string, x: number, deg: boolean) {
  switch (name) {
    case "sin":
      return Math.sin(toRad(x, deg));
    case "cos":
      return Math.cos(toRad(x, deg));
    case "tan":
      return Math.tan(toRad(x, deg));
    case "asin":
      return fromRad(Math.asin(x), deg);
    case "acos":
      return fromRad(Math.acos(x), deg);
    case "atan":
      return fromRad(Math.atan(x), deg);
    case "ln":
      return Math.log(x);
    case "log":
      return Math.log10(x);
    case "sqrt":
      return Math.sqrt(x);
    case "abs":
      return Math.abs(x);
    default:
      return NaN;
  }
}

function evalRpn(rpn: Tok[], deg: boolean): number {
  const st: number[] = [];
  for (const t of rpn) {
    if (t.k === "n") st.push(t.v);
    else if (t.k === "u-") {
      const a = st.pop();
      if (a == null) return NaN;
      st.push(-a);
    } else if (t.k === "fn") {
      const a = st.pop();
      if (a == null) return NaN;
      st.push(applyFn(t.v, a, deg));
    } else if (t.k === "op") {
      const b = st.pop();
      const a = st.pop();
      if (a == null || b == null) return NaN;
      if (t.v === "+") st.push(a + b);
      else if (t.v === "-") st.push(a - b);
      else if (t.v === "*") st.push(a * b);
      else if (t.v === "/") st.push(a / b);
      else if (t.v === "^") st.push(a ** b);
    }
  }
  return st.length === 1 ? st[0] : NaN;
}

export type CalcResult = { ok: true; value: number } | { ok: false; error: string };

export function evalCalc(expr: string, deg: boolean, ans = 0): CalcResult {
  const trimmed = expr.trim();
  if (!trimmed) return { ok: false, error: "Empty" };
  const toks = tokenize(trimmed, ans);
  if (typeof toks === "string") return { ok: false, error: toks };
  const rpn = toRpn(implicits(toks));
  if (typeof rpn === "string") return { ok: false, error: rpn };
  const v = evalRpn(rpn, deg);
  if (!Number.isFinite(v)) return { ok: false, error: "Undefined" };
  return { ok: true, value: v };
}

export function fmtCalc(n: number) {
  if (!Number.isFinite(n)) return "Error";
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e10 || a < 1e-6)) return n.toExponential(6).replace(/e\+?/, "e");
  const s = n.toPrecision(10);
  return String(Number(s));
}
