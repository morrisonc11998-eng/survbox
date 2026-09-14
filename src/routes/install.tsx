import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";

const WEB = "https://morrisonc11998-eng.github.io/survbox/";
const RELEASES = "https://github.com/morrisonc11998-eng/survbox/releases/latest";

export const Route = createFileRoute("/install")({ component: Install });

function Install() {
  return (
    <Shell title="Add to phone" backTo="/">
      <div className="grid gap-5 text-sm leading-relaxed text-muted">
        <p className="text-fg">
          Same field kit on the phone and in the browser. Bushcraft plates, real
          photos, splint procedure, the math. The APK is offline. The site needs
          a network the first time.
        </p>

        <section className="grid gap-2">
          <h2 className="font-display text-lg font-semibold tracking-wide text-fg">
            In the browser
          </h2>
          <ol className="grid list-decimal gap-2 pl-5">
            <li>
              Open{" "}
              <a className="text-accent underline-offset-2 hover:underline" href={WEB}>
                the web kit
              </a>
              .
            </li>
            <li>Chrome: menu → Add to Home screen or Install app.</li>
            <li>Safari: Share → Add to Home Screen.</li>
          </ol>
          <p className="text-xs text-subtle">
            This is the full kit — shelters, knots, traps, tinder, sphagnum, mud,
            splint. Not a store listing.
          </p>
        </section>

        <section className="grid gap-2">
          <h2 className="font-display text-lg font-semibold tracking-wide text-fg">
            Android APK
          </h2>
          <ol className="grid list-decimal gap-2 pl-5">
            <li>
              Open{" "}
              <a
                className="text-accent underline-offset-2 hover:underline"
                href={RELEASES}
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
          <p className="text-xs text-subtle">
            Real app icon. Runs with no signal. The Chrome shortcut still needs
            the site.
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
