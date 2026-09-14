import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-fg">
      <p className="font-display text-2xl">Not found. Go home.</p>
    </main>
  );
}

export function getRouter() {
  const base = import.meta.env.BASE_URL || "/";
  const basepath = !base || base === "/" ? undefined : base.replace(/\/$/, "");
  return createRouter({
    routeTree,
    basepath,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFound,
  });
}
