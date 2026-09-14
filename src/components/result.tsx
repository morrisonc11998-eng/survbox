export function Result({
  items,
  note,
  tone = "ok",
}: {
  items: { k: string; v: string }[];
  note?: string;
  tone?: "ok" | "warn" | "danger";
}) {
  const border =
    tone === "danger"
      ? "border-danger/50"
      : tone === "warn"
        ? "border-warn/50"
        : "border-ok/40";
  return (
    <div className={`rounded-lg border bg-raised p-4 ${border}`}>
      <dl className="grid gap-2">
        {items.map((it) => (
          <div key={it.k} className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-muted">{it.k}</dt>
            <dd className="font-mono text-base tabular-nums">{it.v}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="mt-3 text-sm leading-relaxed text-fg">{note}</p> : null}
    </div>
  );
}

export function How({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-muted">{children}</p>
  );
}

export function Eq({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-sm bg-bg px-3 py-2 font-mono text-xs leading-relaxed text-accent">
      {children}
    </p>
  );
}
