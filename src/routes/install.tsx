import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/install")({ component: Install });

function Install() {
  return (
    <Shell title="Add to phone" backTo="/">
      <div className="grid gap-4 text-sm leading-relaxed text-muted">
        <p className="text-fg">
          This is a phone-first field kit. On Android, add it to the home screen
          so it launches full-screen like an app — no store required.
        </p>
        <ol className="grid list-decimal gap-2 pl-5">
          <li>Open this page in Chrome.</li>
          <li>Tap the menu (three dots).</li>
          <li>Tap Add to Home screen or Install app.</li>
          <li>Open SURVBOX from the icon.</li>
        </ol>
        <p>
          Timers keep the screen awake while they run. US / SI lives in the
          header.
        </p>
      </div>
    </Shell>
  );
}
