import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/field";
import { fmtMeters, fmtSpeed, type PhoneSensors } from "@/lib/survbox/sensors";
import { formatLatLon } from "@/lib/survbox/math";

export function SensorDock({
  s,
  imperial,
  children,
}: {
  s: PhoneSensors;
  imperial: boolean;
  children?: React.ReactNode;
}) {
  const { fix, track, msg, armed } = s;
  const coord = fix ? formatLatLon(fix) : null;
  return (
    <Panel className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xs font-semibold tracking-[0.18em] text-muted uppercase">
          Phone
        </p>
        <Button variant="secondary" className="px-3" onClick={() => void s.arm()}>
          {armed ? "Refresh sensors" : "Use phone"}
        </Button>
      </div>
      {msg ? <p className="text-xs text-warn">{msg}</p> : null}
      {fix ? (
        <dl className="grid gap-1.5 font-mono text-sm tabular-nums">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Fix</dt>
            <dd className="text-right">{coord?.ddm}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Accuracy</dt>
            <dd>±{fmtMeters(fix.accM, imperial)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Alt</dt>
            <dd>
              {fix.altM != null
                ? `${fmtMeters(fix.altM, imperial)} ${fix.altSource ?? ""}`
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Heading</dt>
            <dd>{fix.heading != null ? `${fix.heading.toFixed(0)}°` : "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Course</dt>
            <dd>{fix.courseDeg != null ? `${fix.courseDeg.toFixed(0)}°` : "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Pitch</dt>
            <dd>{fix.pitchDeg != null ? `${fix.pitchDeg.toFixed(0)}°` : "—"}</dd>
          </div>
          {fix.speedMps != null && fix.speedMps > 0.3 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Speed</dt>
              <dd>{fmtSpeed(fix.speedMps, imperial)}</dd>
            </div>
          ) : null}
          {fix.pressureHpa != null ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Pressure</dt>
              <dd>{fix.pressureHpa.toFixed(1)} hPa</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="text-sm leading-relaxed text-muted">
          GPS, compass, barometer, pitch. Numbers still type if the phone will
          not share them.
        </p>
      )}
      {track.points > 0 || track.running ? (
        <p className="font-mono text-sm tabular-nums text-fg">
          Track {fmtMeters(track.distM, imperial)}
          {track.climbM > 0 ? `  +${fmtMeters(track.climbM, imperial)}` : ""}
          {track.running ? "  · live" : ""}
        </p>
      ) : null}
      {children}
    </Panel>
  );
}
