import { useEffect } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useUnits } from "@/lib/survbox/units";
import { DISCLAIMER } from "@/lib/survbox/disclaimer";
import { Button } from "@/components/ui/button";

export function Shell({
  title,
  backTo,
  children,
}: {
  title: string;
  backTo?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { system, setSystem } = useUnits();
  const showBack = backTo != null || pathname !== "/";

  useEffect(() => {
    useUnits.persist.rehydrate();
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-bg/95 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm">
        {showBack ? (
          <button
            type="button"
            aria-label="Back"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-fg"
            onClick={() => router.history.push(backTo ?? "/")}
          >
            <ChevronLeft className="size-6" />
          </button>
        ) : (
          <div className="size-11" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-[11px] font-semibold tracking-[0.22em] text-muted uppercase">
            Field kit
          </p>
          <h1 className="truncate font-display text-2xl font-semibold leading-tight tracking-wide">
            {title}
          </h1>
        </div>
        <div className="flex rounded-md border border-border bg-raised p-0.5 text-xs">
          <button
            type="button"
            className={`min-h-9 rounded-sm px-2.5 font-medium ${system === "us" ? "bg-accent text-accent-fg" : "text-muted"}`}
            onClick={() => setSystem("us")}
          >
            US
          </button>
          <button
            type="button"
            className={`min-h-9 rounded-sm px-2.5 font-medium ${system === "metric" ? "bg-accent text-accent-fg" : "text-muted"}`}
            onClick={() => setSystem("metric")}
          >
            SI
          </button>
        </div>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
      <footer className="grid gap-3 px-4 pb-4">
        <p className="text-center text-xs leading-relaxed text-subtle">{DISCLAIMER}</p>
        {backTo == null ? (
          <p className="text-center text-xs">
            <Link to="/install" className="text-muted underline-offset-2 hover:underline">
              Add to phone
            </Link>
          </p>
        ) : (
          <Button variant="ghost" className="w-full" onClick={() => router.history.push("/")}>
            Home
          </Button>
        )}
      </footer>
    </div>
  );
}
