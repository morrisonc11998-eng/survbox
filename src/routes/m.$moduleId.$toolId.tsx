import { createFileRoute, notFound } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { getModule, getTool } from "@/lib/survbox/catalog";
import { TOOLS } from "@/components/tools/registry";

export const Route = createFileRoute("/m/$moduleId/$toolId")({
  component: ToolPage,
});

function ToolPage() {
  const { moduleId, toolId } = Route.useParams();
  const mod = getModule(moduleId);
  const tool = getTool(moduleId, toolId);
  const View = TOOLS[toolId];
  if (!mod || !tool || !View) throw notFound();
  return (
    <Shell title={tool.title} backTo={`/m/${moduleId}`}>
      <View />
    </Shell>
  );
}
