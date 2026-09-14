import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { MODULES } from "@/lib/survbox/catalog";
import { DISCLAIMER } from "@/lib/survbox/disclaimer";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <Shell title="SURVBOX">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Pocket field kit. Type real numbers. Get a decision, not a lecture. Stay
        found.
      </p>
      <p className="mb-4 text-xs leading-relaxed text-subtle">{DISCLAIMER}</p>
      <div className="grid gap-3">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              to="/m/$moduleId"
              params={{ moduleId: m.id }}
              className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 active:scale-[0.99]"
            >
              <span className="flex size-11 items-center justify-center rounded-md bg-raised text-accent">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-xl font-semibold tracking-wide">
                  {m.title}
                </span>
                <span className="block text-sm text-muted">{m.blurb}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
