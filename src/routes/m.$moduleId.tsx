import { createFileRoute, Link, Outlet, notFound, useChildMatches } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Shell } from "@/components/shell";
import { getModule } from "@/lib/survbox/catalog";

export const Route = createFileRoute("/m/$moduleId")({
  component: ModulePage,
});

function ModulePage() {
  const children = useChildMatches();
  const { moduleId } = Route.useParams();
  if (children.length > 0) return <Outlet />;

  const mod = getModule(moduleId);
  if (!mod) throw notFound();
  return (
    <Shell title={mod.title} backTo="/">
      <p className="mb-4 text-sm text-muted">{mod.blurb}</p>
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
