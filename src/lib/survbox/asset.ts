/** Public file under Vite `base` (`/` in preview and the APK, `/survbox/` on GitHub Pages). */
export function asset(path: string) {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return base.endsWith("/") ? `${base}${clean}` : `${base}/${clean}`;
}
