#!/usr/bin/env node
/**
 * Static SPA bundle.
 * Default: Capacitor WebView → android-www (base /).
 * GitHub Pages: SURVBOX_WWW=pages-www SURVBOX_BASE=/survbox/
 */
import { spawn } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wwwName = process.env.SURVBOX_WWW || "android-www";
const baseRaw = process.env.SURVBOX_BASE || "/";
const base = baseRaw.endsWith("/") ? baseRaw : `${baseRaw}/`;
const www = join(root, wwwName);
const pages = wwwName === "pages-www";

function run(cmd, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function findShell(candidates) {
  const names = ["index.html", "_shell.html", "shell.html"];
  for (const dir of candidates) {
    for (const name of names) {
      const p = join(dir, name);
      if (existsSync(p)) return p;
    }
  }
  for (const dir of candidates) {
    for (const p of walk(dir)) {
      if (!p.endsWith(".html")) continue;
      const html = readFileSync(p, "utf8");
      if (html.includes("SURVBOX") || html.includes("stylesheet")) return p;
    }
  }
  return null;
}

await run("node", ["scripts/with-app-env.mjs", "vite", "build"], {
  SURVBOX_ANDROID: "1",
  SURVBOX_BASE: base,
});

const candidates = [
  join(root, ".output/public"),
  join(root, "dist/client"),
  join(root, "dist/public"),
  join(root, "dist"),
  join(root, ".vercel/output/static"),
];

const existing = candidates.filter((d) => existsSync(d));
console.log("[static] build dirs:", existing.join(", ") || "(none)");

const shell = findShell(existing);
if (!shell) {
  console.error("[static] no HTML shell found. Looked in:", existing);
  process.exit(1);
}
console.log("[static] shell:", shell);

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

const shellDir = dirname(shell);
cpSync(shellDir, www, { recursive: true });

const pub = join(root, "public");
if (existsSync(pub)) {
  cpSync(pub, www, { recursive: true });
}

const css = readdirSync(join(www, "assets")).find(
  (f) => f.startsWith("styles-") && f.endsWith(".css"),
);
if (!css) {
  console.error("[static] no client CSS in", join(www, "assets"));
  process.exit(1);
}

const cssHref = `${base}assets/${css}`;
let html = readFileSync(shell, "utf8");
html = html.replace(/(?:\/survbox)?\/assets\/styles-[^"]+\.css/g, cssHref);
if (base !== "/") {
  html = html.replace(/(href|src)="\/(?!survbox\/)/g, `$1="${base}`);
}
if (!html.includes("<html")) {
  console.error("[static] index.html is not a full document");
  process.exit(1);
}
writeFileSync(join(www, "index.html"), html);

const grok = join(www, "__grok");
mkdirSync(grok, { recursive: true });
writeFileSync(
  join(grok, "manifest.webmanifest"),
  JSON.stringify(
    {
      name: "SURVBOX",
      short_name: "SURVBOX",
      display: "standalone",
      background_color: "#111410",
      theme_color: "#111410",
      start_url: base,
      scope: base,
      icons: [
        { src: `${base}icon-192.png`, sizes: "192x192", type: "image/png" },
        { src: `${base}icon-512.png`, sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2,
  ),
);

if (pages) {
  writeFileSync(join(www, "404.html"), html);
  writeFileSync(join(www, ".nojekyll"), "");
}

const files = walk(www).length;
console.log("[static]", wwwName, "ready,", files, "files; css", css, "base", base);
