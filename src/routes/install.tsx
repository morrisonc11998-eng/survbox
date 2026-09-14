import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/install")({ component: Install });

function Install() {
  return (
    <Shell title="Add to phone" backTo="/">
      <div className="grid gap-5 text-sm leading-relaxed text-muted">
        <p className="text-fg">
          SURVBOX is a phone-first field kit. The Android package is a real
          app icon that runs offline. No store. No signal required.
        </p>

        <section className="grid gap-2">
          <h2 className="font-display text-lg font-semibold tracking-wide text-fg">
            Android APK
          </h2>
          <ol className="grid list-decimal gap-2 pl-5">
            <li>
              Open{" "}
              <a
                className="text-accent underline-offset-2 hover:underline"
                href="https://github.com/morrisonc11998-eng/survbox/releases/latest"
              >
                the latest GitHub release
              </a>
              .
            </li>
            <li>Download SURVBOX.apk.</li>
            <li>Open the file. Allow install from that source if Android asks.</li>
            <li>
              Play Protect may warn — this is a sideload, not a Play Store
              listing. Install anyway if you trust the release.
            </li>
          </ol>
        </section>

        <section className="grid gap-2">
          <h2 className="font-display text-lg font-semibold tracking-wide text-fg">
            Chrome shortcut
          </h2>
          <p>If you would rather not sideload:</p>
          <ol className="grid list-decimal gap-2 pl-5">
            <li>Open this page in Chrome.</li>
            <li>Tap the menu (three dots).</li>
            <li>Tap Add to Home screen or Install app.</li>
            <li>Open SURVBOX from the icon.</li>
          </ol>
          <p className="text-xs text-subtle">
            The shortcut still needs the site. The APK does not.
          </p>
        </section>

        <p>
          Timers keep the screen awake while they run. US / SI lives in the
          header.
        </p>
      </div>
    </Shell>
  );
}
