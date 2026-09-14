import { createFileRoute, Link, Outlet, notFound, useChildMatches } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { TOOLS } from "@/components/tools/registry";
import { getModule } from "@/lib/survbox/catalog";
import { fmtMeters, usePhoneSensors } from "@/lib/survbox/sensors";
import { useUnits } from "@/lib/survbox/units";

export const Route = createFileRoute("/m/$moduleId")({
  component: ModulePage,
});

function ModulePage() {
  const children = useChildMatches();
  const { moduleId } = Route.useParams();
  const mod = getModule(moduleId);
  if (!mod) throw notFound();

  if (children.length > 0) return <Outlet />;

  const single = mod.tools.length === 1 ? mod.tools[0] : null;
  const View = single ? TOOLS[single.id] : null;
  if (View) {
    return (
      <Shell title={mod.title} backTo="/">
        <View />
      </Shell>
    );
  }
  return <ModuleIndex />;
}

function ModuleIndex() {
  const { moduleId } = Route.useParams();
  const mod = getModule(moduleId);
  if (!mod) throw notFound();
  return (
    <Shell title={mod.title} backTo="/">
      <p className="mb-4 text-sm text-muted">{mod.blurb}</p>
      {moduleId === "move" ? <MovePhoneLine /> : null}
      <div className="grid gap-2">
        {mod.tools.map((t) => (
          <Link
            key={t.id}
            to="/m/$moduleId/$toolId"
            params={{ moduleId, toolId: t.id }}
            className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
          >
            <span>
              <span className="block font-medium">{t.title}</span>
              <span className="block text-sm text-muted">{t.blurb}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-subtle" />
          </Link>
        ))}
      </div>
    </Shell>
  );
}

function MovePhoneLine() {
  const s = usePhoneSensors();
  const { system } = useUnits();
  const imperial = system === "us";
  const fix = s.fix;
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <p className="min-w-0 text-sm leading-relaxed text-muted">
        {fix
          ? `GPS ±${fmtMeters(fix.accM, imperial)}${fix.heading != null ? ` · ${fix.heading.toFixed(0)}°` : ""}${fix.altM != null ? ` · ${fmtMeters(fix.altM, imperial)}` : ""}`
          : "Arm the phone once. GPS, compass, and barometer feed every plate here."}
      </p>
      <Button variant="secondary" className="shrink-0 px-3" onClick={() => void s.arm()}>
        {s.armed ? "Live" : "Use phone"}
      </Button>
    </div>
  );
}
