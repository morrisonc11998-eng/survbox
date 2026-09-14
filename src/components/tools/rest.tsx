import { useMemo, useState } from "react";
import { Field, NumInput, Select, Panel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FieldTimer } from "@/components/timer";
import { Eq, How, Result } from "@/components/result";
import { SensorDock } from "@/components/sensor-dock";
import { useUnits } from "@/lib/survbox/units";
import { useNum } from "@/lib/survbox/num";
import { fmtMeters, fmtSpeed, mToLen, mToTravel, usePhoneSensors, type PhoneFix } from "@/lib/survbox/sensors";
import {
  boilC,
  calorieNeed,
  cFromF,
  fFromC,
  formatHours,
  frostbiteNote,
  gradeFromPitch,
  haversineM,
  hangGeometry,
  heatEnergyKJ,
  lPer100,
  mpgFromFill,
  naismithHours,
  paceDistance,
  riseRunM,
  slopeStats,
  windChillF,
  type WorkLevel,
} from "@/lib/survbox/math";

export function ToolSlope() {
  const { system } = useUnits();
  const imperial = system === "us";
  const rise = useNum("");
  const run = useNum("");
  const [out, setOut] = useState<ReturnType<typeof slopeStats> & { note?: string } | null>(null);
  const s = usePhoneSensors();
  const [foot, setFoot] = useState<PhoneFix | null>(null);
  const [crest, setCrest] = useState<PhoneFix | null>(null);
  const [shotPitch, setShotPitch] = useState<number | null>(null);

  function fillFromMarks(a: PhoneFix, b: PhoneFix) {
    const rr = riseRunM(a, b);
    run.setV(mToLen(rr.runM, imperial).toFixed(imperial ? 0 : 1));
    if (rr.riseM != null) rise.setV(mToLen(rr.riseM, imperial).toFixed(imperial ? 0 : 1));
  }

  async function markFoot() {
    const f = await s.afterArm(() => s.fixRef.current);
    if (!f) return;
    setFoot(f);
    setCrest((c) => {
      if (c) fillFromMarks(f, c);
      return c;
    });
  }
  async function markCrest() {
    const f = await s.afterArm(() => s.fixRef.current);
    if (!f) return;
    setCrest(f);
    setFoot((c) => {
      if (c) fillFromMarks(c, f);
      return c;
    });
  }
  async function shootSlope() {
    const p = await s.afterArm(() => s.pitchRef.current);
    if (p == null) return;
    const g = gradeFromPitch(p);
    setShotPitch(g.angle);
    let runN = run.ok ? run.n : NaN;
    if (!Number.isFinite(runN) && foot && crest) {
      runN = mToLen(haversineM(foot, crest), imperial);
      run.setV(runN.toFixed(imperial ? 0 : 1));
    }
    if (Number.isFinite(runN) && runN > 0) {
      rise.setV((runN * Math.tan((g.angle * Math.PI) / 180)).toFixed(1));
    }
  }

  const canCompute =
    (rise.ok && run.ok && run.n > 0) ||
    (foot != null && crest != null) ||
    shotPitch != null;

  return (
    <div className="grid gap-4">
      <How>
        Rise and run in the same units. Grade is the hill. Extra is how much
        farther you walk than the map line. Stand at the bottom, mark, walk the
        slope, mark the top — barometer beats GPS for the rise. Or sight along
        the phone and shoot the pitch.
      </How>
      <Eq>grade% = 100·rise/run · angle = atan(rise/run) · slope = √(r²+run²)</Eq>
      <SensorDock s={s} imperial={imperial}>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => void markFoot()}>
            Mark bottom
          </Button>
          <Button variant="secondary" onClick={() => void markCrest()}>
            Mark top
          </Button>
        </div>
        <Button variant="secondary" className="w-full" onClick={() => void shootSlope()}>
          Shoot pitch
        </Button>
        <p className="font-mono text-sm tabular-nums text-fg">
          Live pitch {s.live.pitchDeg != null ? `${s.live.pitchDeg.toFixed(0)}°` : "—"}
        </p>
        {foot || crest || shotPitch != null ? (
          <p className="text-xs leading-relaxed text-subtle">
            {foot ? `Bottom ±${fmtMeters(foot.accM, imperial)}.` : "No bottom yet."}{" "}
            {crest ? `Top ±${fmtMeters(crest.accM, imperial)}.` : "No top yet."}
            {shotPitch != null ? ` Pitch ${shotPitch.toFixed(0)}°.` : ""}
            {foot && crest && (foot.altM == null || crest.altM == null)
              ? " No altitude on one mark — type the rise or shoot pitch."
              : ""}
          </p>
        ) : null}
      </SensorDock>
      <Panel className="grid gap-3">
        <Field label={`Rise (${imperial ? "ft" : "m"})`}>
          <NumInput value={rise.v} onChange={(e) => rise.setV(e.target.value)} />
        </Field>
        <Field label={`Run map (${imperial ? "ft" : "m"})`}>
          <NumInput value={run.v} onChange={(e) => run.setV(e.target.value)} />
        </Field>
      </Panel>
      <Button
        className="w-full"
        disabled={!canCompute}
        onClick={() => {
          let riseN = rise.ok ? rise.n : NaN;
          let runN = run.ok ? run.n : NaN;
          if ((!Number.isFinite(riseN) || !Number.isFinite(runN) || runN <= 0) && foot && crest) {
            const rr = riseRunM(foot, crest);
            runN = mToLen(rr.runM, imperial);
            run.setV(runN.toFixed(imperial ? 0 : 1));
            if (rr.riseM != null) {
              riseN = mToLen(rr.riseM, imperial);
              rise.setV(riseN.toFixed(imperial ? 0 : 1));
            }
          }
          if ((!Number.isFinite(riseN) || !Number.isFinite(runN) || runN <= 0) && shotPitch != null) {
            if (Number.isFinite(runN) && runN > 0) {
              riseN = runN * Math.tan((shotPitch * Math.PI) / 180);
              rise.setV(riseN.toFixed(1));
            } else {
              const g = gradeFromPitch(shotPitch);
              setOut({
                ...slopeStats(Math.tan((g.angle * Math.PI) / 180), 1),
                note: "Per 1 of map run. GPS the run for a length.",
              });
              return;
            }
          }
          if (!Number.isFinite(riseN) || !Number.isFinite(runN) || runN <= 0) return;
          const stats = slopeStats(riseN, runN);
          setOut({
            ...stats,
            note:
              stats.grade >= 40
                ? "Scramble. Think twice about a pack."
                : stats.grade >= 20
                  ? "Hard climb. Slow it down."
                  : stats.grade >= 10
                    ? "Steady climb."
                    : "Walkable grade.",
          });
        }}
      >
        Compute
      </Button>
      {out ? (
        <Result
          items={[
            { k: "Grade", v: `${out.grade.toFixed(1)}%` },
            { k: "Angle", v: `${out.angle.toFixed(1)}°` },
            { k: "Slope length", v: out.slopeLen.toFixed(1) },
            { k: "Extra vs flat", v: out.extra.toFixed(1) },
          ]}
          note={out.note}
        />
      ) : null}
    </div>
  );
}

export function ToolHike() {
  const { system } = useUnits();
  const dist = useNum("");
  const climb = useNum("");
  const pack = useNum("0");
  const terr = useNum("1");
  const lite = useNum("");
  const [out, setOut] = useState<null | { hours: number; note: string }>(null);
  const imperial = system === "us";
  const s = usePhoneSensors();

  function applyTrack() {
    const t = s.track;
    if (t.distM < 10) return false;
    dist.setV(mToTravel(t.distM, imperial).toFixed(2));
    climb.setV(mToLen(t.climbM, imperial).toFixed(0));
    return true;
  }

  return (
    <div className="grid gap-4">
      <How>
        Moving time only. Add rests. Night walking is how people get hurt. Pack
        slows you about 5.5% per 10 lb. Start a GPS track on the trail you just
        walked — Estimate uses it if the fields are empty. Live speed is a check
        against Naismith, not a replacement.
      </How>
      <Eq>hr = mi/3 + ft/2000  or  km/5 + m/600  then × pack × terrain</Eq>
      <SensorDock s={s} imperial={imperial}>
        <div className="grid grid-cols-2 gap-2">
          {s.track.running ? (
            <Button variant="secondary" onClick={() => s.stopTrack()}>
              Stop track
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => void s.startTrack()}>
              Start track
            </Button>
          )}
          <Button variant="secondary" disabled={s.track.distM < 10} onClick={() => applyTrack()}>
            Fill hike
          </Button>
        </div>
      </SensorDock>
      <Panel className="grid gap-3">
        <Field label={imperial ? "Distance mi" : "Distance km"}>
          <NumInput value={dist.v} onChange={(e) => dist.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Climb ft" : "Climb m"}>
          <NumInput value={climb.v} onChange={(e) => climb.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Pack lb (0 ok)" : "Pack kg (0 ok)"}>
          <NumInput value={pack.v} onChange={(e) => pack.setV(e.target.value)} />
        </Field>
        <Field label="Terrain">
          <Select value={terr.v} onChange={(e) => terr.setV(e.target.value)}>
            <option value="1">Trail 1.0</option>
            <option value="1.2">Rough 1.2</option>
            <option value="1.5">Brush 1.5</option>
            <option value="2">Off-trail 2.0</option>
          </Select>
        </Field>
        <Field label="Daylight left (min, 0 skip)">
          <NumInput value={lite.v} onChange={(e) => lite.setV(e.target.value)} />
        </Field>
      </Panel>
      <Button
        className="w-full"
        disabled={!dist.ok && s.track.distM < 10}
        onClick={() => {
          let distN = dist.ok ? dist.n : NaN;
          let climbN = climb.ok ? climb.n : 0;
          if (!Number.isFinite(distN) && s.track.distM >= 10) {
            applyTrack();
            distN = mToTravel(s.track.distM, imperial);
            climbN = mToLen(s.track.climbM, imperial);
          }
          if (!Number.isFinite(distN)) return;
          const hours = naismithHours({
            imperial,
            dist: distN,
            climb: climbN,
            packLb: pack.ok ? (imperial ? pack.n : pack.n * 2.20462) : 0,
            terrain: terr.ok ? terr.n : 1,
          });
          const need = hours * 60;
          let note = "Add rests.";
          if (lite.ok && lite.n > 0) {
            note = need > lite.n ? `NOT back by dark. Need ${Math.round(need)} min.` : `Light margin ${Math.round(lite.n - need)} min.`;
          }
          const speed = s.fix?.speedMps;
          if (speed != null && speed > 0.4) {
            const distM = imperial ? distN * 1609.34 : distN * 1000;
            const gpsH = distM / speed / 3600;
            note = `${note} GPS is ${fmtSpeed(speed, imperial)} — that pace is ${formatHours(gpsH)} with no rest.`;
          }
          setOut({ hours, note });
        }}
      >
        Estimate time
      </Button>
      {out ? (
        <Result
          items={[{ k: "Moving time", v: formatHours(out.hours) }]}
          note={out.note}
          tone={out.note.startsWith("NOT") ? "danger" : "ok"}
        />
      ) : null}
    </div>
  );
}

export function ToolCals() {
  const { system } = useUnits();
  const imperial = system === "us";
  const sex = useNum("1");
  const age = useNum("");
  const height = useNum("");
  const weight = useNum("");
  const work = useNum("2");
  const t = useNum(imperial ? "70" : "21");
  const rh = useNum("50");
  const dist = useNum("");
  const gain = useNum("");
  const [out, setOut] = useState<ReturnType<typeof calorieNeed> | null>(null);
  const s = usePhoneSensors();

  const workId: WorkLevel = work.n === 1 ? "light" : work.n === 3 ? "heavy" : "medium";

  function fillTrack() {
    const tr = s.track;
    if (tr.distM < 10) return;
    dist.setV(mToTravel(tr.distM, imperial).toFixed(2));
    if (tr.climbM > 0) gain.setV(mToLen(tr.climbM, imperial).toFixed(0));
  }

  return (
    <div className="grid gap-4">
      <How>
        This is fuel for a day, not a diet plan. Mifflin-St Jeor sets the resting
        burn. Work is how hard the body is actually working. Walk and climb sit
        on top of that. Cold and humid heat tax you extra. A GPS track fills
        the miles and the gain.
      </How>
      <ul className="grid gap-2 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed">
        <li>
          <span className="font-medium text-fg">Light.</span> Camp chores, cooking,
          map work, easy trail. Full sentences. Heart barely up.
        </li>
        <li>
          <span className="font-medium text-fg">Medium.</span> Steady hike, packing,
          sawing, repeated lifting. Talk in phrases.
        </li>
        <li>
          <span className="font-medium text-fg">Heavy.</span> Brush, snow, casualty
          drag, digging, steep with a load. Breathing hard. Short words.
        </li>
      </ul>
      <Eq>
        BMR = 10·kg + 6.25·cm − 5·age + s · day = BMR×PAL + kg·km·k + 0.007·kg·m + weather
      </Eq>
      <SensorDock s={s} imperial={imperial}>
        <div className="grid grid-cols-2 gap-2">
          {s.track.running ? (
            <Button variant="secondary" onClick={() => s.stopTrack()}>
              Stop track
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => void s.startTrack()}>
              Start track
            </Button>
          )}
          <Button variant="secondary" disabled={s.track.distM < 10} onClick={fillTrack}>
            Fill miles
          </Button>
        </div>
      </SensorDock>
      <Panel className="grid gap-3">
        <Field label="Sex">
          <Select value={sex.v} onChange={(e) => sex.setV(e.target.value)}>
            <option value="1">Male</option>
            <option value="0">Female</option>
          </Select>
        </Field>
        <Field label="Age years">
          <NumInput value={age.v} onChange={(e) => age.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Height in" : "Height cm"}>
          <NumInput value={height.v} onChange={(e) => height.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Weight lb" : "Weight kg"}>
          <NumInput value={weight.v} onChange={(e) => weight.setV(e.target.value)} />
        </Field>
        <Field label="Work">
          <Select value={work.v} onChange={(e) => work.setV(e.target.value)}>
            <option value="1">Light</option>
            <option value="2">Medium</option>
            <option value="3">Heavy</option>
          </Select>
        </Field>
        <Field label={imperial ? "Air °F" : "Air °C"}>
          <NumInput value={t.v} onChange={(e) => t.setV(e.target.value)} />
        </Field>
        <Field label="Humidity %">
          <NumInput value={rh.v} onChange={(e) => rh.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Distance walked mi (0 ok)" : "Distance walked km (0 ok)"}>
          <NumInput value={dist.v} onChange={(e) => dist.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Elevation gain ft (optional)" : "Elevation gain m (optional)"}>
          <NumInput value={gain.v} onChange={(e) => gain.setV(e.target.value)} />
        </Field>
      </Panel>
      <Button
        className="w-full"
        disabled={!age.ok || !height.ok || !weight.ok || !t.ok || height.n <= 0 || weight.n <= 0}
        onClick={() => {
          if (!age.ok || !height.ok || !weight.ok || !t.ok || height.n <= 0 || weight.n <= 0) return;
          let distN = dist.ok ? dist.n : NaN;
          let gainN = gain.ok ? gain.n : 0;
          if (!Number.isFinite(distN) && s.track.distM >= 10) {
            fillTrack();
            distN = mToTravel(s.track.distM, imperial);
            gainN = mToLen(s.track.climbM, imperial);
          }
          const cm = imperial ? height.n * 2.54 : height.n;
          const kg = imperial ? weight.n * 0.453592 : weight.n;
          const tF = imperial ? t.n : fFromC(t.n);
          const distKm = Number.isFinite(distN) ? (imperial ? distN * 1.60934 : distN) : 0;
          const gainM = imperial ? gainN * 0.3048 : gainN;
          setOut(
            calorieNeed({
              kg,
              cm,
              age: age.n,
              male: sex.n !== 0,
              work: workId,
              tF,
              rh: rh.ok ? rh.n : 50,
              distKm,
              gainM,
            }),
          );
        }}
      >
        Estimate kcal
      </Button>
      {out ? (
        <Result
          items={[
            { k: "Resting BMR", v: `${out.bmr} kcal` },
            { k: "Day at this work", v: `${out.camp} kcal` },
            { k: "Walk / climb", v: `${out.walk} kcal` },
            { k: "Weather extra", v: `${out.weather} kcal` },
            { k: "Day total", v: `${out.total} kcal` },
          ]}
          note={
            out.total >= 4500
              ? "Hard day. Eat early. Fat and carbs while you still want them."
              : out.walk === 0
                ? "No miles in. This is camp / labor only."
                : "That walk is on top of the work day. Fat and carbs while moving."
          }
          tone={out.total >= 5000 ? "warn" : "ok"}
        />
      ) : null}
    </div>
  );
}

export function ToolPace() {
  const unit = useNum("1");
  const cal = useNum("");
  const n = useNum("");
  const [dist, setDist] = useState<number | null>(null);
  const unitName = unit.n === 1 ? "meters" : unit.n === 2 ? "yards" : "feet";
  const { system } = useUnits();
  const imperial = system === "us";
  const s = usePhoneSensors();
  const [start, setStart] = useState<PhoneFix | null>(null);
  const [end, setEnd] = useState<PhoneFix | null>(null);

  function distMFromGps() {
    if (start && end) return haversineM(start, end);
    if (s.track.distM >= 20) return s.track.distM;
    return 0;
  }

  function toUnit(meters: number) {
    if (unit.n === 1) return meters;
    if (unit.n === 2) return meters * 1.09361;
    return meters * 3.28084;
  }

  function calibrateGps() {
    if (!n.ok || n.n <= 0) return;
    const meters = distMFromGps();
    if (meters < 20) return;
    cal.setV(((n.n * 100) / toUnit(meters)).toFixed(1));
  }

  async function markStart() {
    const f = await s.afterArm(() => s.fixRef.current);
    if (f) setStart(f);
  }
  async function markEnd() {
    const f = await s.afterArm(() => s.fixRef.current);
    if (f) setEnd(f);
  }

  const gpsM = distMFromGps();

  return (
    <div className="grid gap-4">
      <How>
        Walk a measured 100 of your unit on this ground. Count every time the
        same foot hits — that is one pace. Recal on slope, sand, snow, night,
        fatigue. Or mark start, walk, mark end. GPS measures the ground. You
        still count.
      </How>
      <Eq>dist = (paces walked / paces per 100) × 100</Eq>
      <SensorDock s={s} imperial={imperial}>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => void markStart()}>
            Mark start
          </Button>
          <Button variant="secondary" onClick={() => void markEnd()}>
            Mark end
          </Button>
          {s.track.running ? (
            <Button variant="secondary" onClick={() => s.stopTrack()}>
              Stop track
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => void s.startTrack()}>
              Start track
            </Button>
          )}
          <Button
            variant="secondary"
            disabled={gpsM < 20 || !n.ok || n.n <= 0}
            onClick={calibrateGps}
          >
            Calibrate
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-subtle">
          Enter paces walked, then Calibrate. That writes paces per 100 from the
          GPS distance.
          {gpsM >= 20 ? ` GPS ${fmtMeters(gpsM, imperial)}.` : ""}
        </p>
      </SensorDock>
      <Panel className="grid gap-3">
        <Field label="Unit you calibrated">
          <Select value={unit.v} onChange={(e) => unit.setV(e.target.value)}>
            <option value="1">Meters</option>
            <option value="2">Yards</option>
            <option value="3">Feet</option>
          </Select>
        </Field>
        <Field label={`Paces for 100 ${unitName}`}>
          <NumInput value={cal.v} onChange={(e) => cal.setV(e.target.value)} />
        </Field>
        <Field label="Paces walked">
          <NumInput value={n.v} onChange={(e) => n.setV(e.target.value)} />
        </Field>
      </Panel>
      <Button
        className="w-full"
        disabled={!n.ok || ((!cal.ok || cal.n <= 0) && gpsM < 20)}
        onClick={() => {
          if (!n.ok) return;
          let per = cal.ok && cal.n > 0 ? cal.n : NaN;
          if (!Number.isFinite(per) && gpsM >= 20) {
            per = (n.n * 100) / toUnit(gpsM);
            cal.setV(per.toFixed(1));
          }
          if (!Number.isFinite(per) || per <= 0) return;
          setDist(paceDistance(n.n, per));
        }}
      >
        Distance
      </Button>
      {dist != null ? (
        <Result
          items={
            unit.n === 1
              ? [
                  { k: "Meters", v: dist.toFixed(1) },
                  { k: "Miles", v: (dist / 1609.34).toFixed(3) },
                ]
              : unit.n === 2
                ? [
                    { k: "Yards", v: dist.toFixed(1) },
                    { k: "Miles", v: (dist / 1760).toFixed(3) },
                  ]
                : [
                    { k: "Feet", v: dist.toFixed(1) },
                    { k: "Miles", v: (dist / 5280).toFixed(3) },
                  ]
          }
          note={
            gpsM >= 20
              ? `GPS ${fmtMeters(gpsM, imperial)}. Treat the pace count as the one you use when the sky is gone.`
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

export function ToolHeight() {
  const mode = useNum("1");
  const eye = useNum("");
  const ang = useNum("");
  const d = useNum("");
  const h = useNum("");
  const [out, setOut] = useState<null | { k: string; v: string }>(null);
  const { system } = useUnits();
  const imperial = system === "us";
  const s = usePhoneSensors();
  const [obj, setObj] = useState<PhoneFix | null>(null);
  const [here, setHere] = useState<PhoneFix | null>(null);

  function fillBase(a: PhoneFix, b: PhoneFix) {
    d.setV(mToLen(haversineM(a, b), imperial).toFixed(imperial ? 0 : 1));
  }

  async function markObj() {
    const f = await s.afterArm(() => s.fixRef.current);
    if (!f) return;
    setObj(f);
    setHere((c) => {
      if (c) fillBase(f, c);
      return c;
    });
  }
  async function markHere() {
    const f = await s.afterArm(() => s.fixRef.current);
    if (!f) return;
    setHere(f);
    setObj((c) => {
      if (c) fillBase(c, f);
      return c;
    });
  }
  async function shootAngle() {
    const p = await s.afterArm(() => s.pitchRef.current);
    if (p == null) return;
    ang.setV(Math.abs(p).toFixed(1));
  }

  const gpsBase = obj && here ? haversineM(obj, here) : 0;

  return (
    <div className="grid gap-4">
      <How>
        Clinometer angle and a paced base on level ground. Point the TOP of the
        phone at the top of the object. Level / horizon is 0°. Sky is +90°.
        Ground is −90°. Do not lay the phone flat and call that 90. Mark the
        object, walk back, mark here — GPS fills the base.
      </How>
      <Eq>h = d·tan(a) + eye · range = (h − eye) / tan(a)</Eq>
      <SensorDock s={s} imperial={imperial}>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => void markObj()}>
            Mark object
          </Button>
          <Button variant="secondary" onClick={() => void markHere()}>
            Mark here
          </Button>
        </div>
        <Button variant="secondary" className="w-full" onClick={() => void shootAngle()}>
          Shoot angle
        </Button>
        <p className="font-mono text-sm tabular-nums text-fg">
          Live pitch {s.live.pitchDeg != null ? `${s.live.pitchDeg.toFixed(0)}°` : "—"}
        </p>
        <p className="text-xs leading-relaxed text-subtle">
          Point the top of the phone. A level phone is 0°, not 90°.
          {gpsBase > 1 ? ` Base ${fmtMeters(gpsBase, imperial)}.` : ""}
        </p>
      </SensorDock>
      <Panel className="grid gap-3">
        <Field label="Mode">
          <Select value={mode.v} onChange={(e) => mode.setV(e.target.value)}>
            <option value="1">Height of object</option>
            <option value="2">Range to object</option>
          </Select>
        </Field>
        <Field label="Eye height (same units as distance)">
          <NumInput value={eye.v} onChange={(e) => eye.setV(e.target.value)} />
        </Field>
        <Field label="Angle deg">
          <NumInput value={ang.v} onChange={(e) => ang.setV(e.target.value)} />
        </Field>
        {mode.n === 1 ? (
          <Field label="Distance to base">
            <NumInput value={d.v} onChange={(e) => d.setV(e.target.value)} />
          </Field>
        ) : (
          <Field label="Known height">
            <NumInput value={h.v} onChange={(e) => h.setV(e.target.value)} />
          </Field>
        )}
      </Panel>
      <Button
        className="w-full"
        disabled={
          !ang.ok ||
          ang.n <= 0 ||
          ang.n >= 90 ||
          !eye.ok ||
          (mode.n === 1 ? !d.ok && gpsBase < 1 : !h.ok)
        }
        onClick={() => {
          if (!ang.ok || ang.n <= 0 || ang.n >= 90 || !eye.ok) return;
          const ta = Math.tan((ang.n * Math.PI) / 180);
          if (mode.n === 1) {
            let distN = d.ok ? d.n : NaN;
            if (!Number.isFinite(distN) && gpsBase >= 1) {
              distN = mToLen(gpsBase, imperial);
              d.setV(distN.toFixed(imperial ? 0 : 1));
            }
            if (!Number.isFinite(distN)) return;
            setOut({ k: "Object height", v: (distN * ta + eye.n).toFixed(1) });
          } else {
            if (!h.ok) return;
            setOut({ k: "Range", v: ((h.n - eye.n) / ta).toFixed(1) });
          }
        }}
      >
        Compute
      </Button>
      {out ? <Result items={[out]} /> : null}
    </div>
  );
}

export function ToolBoil() {
  const { system } = useUnits();
  const elev = useNum("");
  const ts = useNum(system === "us" ? "50" : "10");
  const vol = useNum("1");
  const stove = useNum("3");
  const snow = useNum("0");
  const [out, setOut] = useState<null | { bc: number; min: number; extra: string }>(null);
  const imperial = system === "us";
  const s = usePhoneSensors();
  return (
    <div className="grid gap-4">
      <How>
        Elevation drops the boil. Snow costs latent heat. Wind can double the
        time. Bugs die at a rolling boil. Chemical water stays chemical.
      </How>
      <Eq>Tboil °C = 100 − elev_m/300 · Q = m·4.184·ΔT (+334 kJ/kg ice) · t = Q/(kW·60)</Eq>
      <SensorDock s={s} imperial={imperial}>
        <Button
          variant="secondary"
          className="w-full"
          onClick={async () => {
            const alt = await s.afterArm(
              () => s.baroAltRef.current ?? s.fixRef.current?.altM ?? s.live.baroAltM,
            );
            if (alt == null) return;
            elev.setV(mToLen(alt, imperial).toFixed(0));
          }}
        >
          Fill elevation
        </Button>
      </SensorDock>
      <Panel className="grid gap-3">
        <Field label={imperial ? "Elevation ft" : "Elevation m"}>
          <NumInput value={elev.v} onChange={(e) => elev.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Start water °F" : "Start water °C"}>
          <NumInput value={ts.v} onChange={(e) => ts.setV(e.target.value)} />
        </Field>
        <Field label="Volume liters">
          <NumInput value={vol.v} onChange={(e) => vol.setV(e.target.value)} />
        </Field>
        <Field label="Heat">
          <Select value={stove.v} onChange={(e) => stove.setV(e.target.value)}>
            <option value="1">Weak fire ~0.5 kW</option>
            <option value="2">Good fire ~1.1 kW</option>
            <option value="3">Canister ~1.0 kW</option>
            <option value="4">Big stove ~1.7 kW</option>
          </Select>
        </Field>
        <Field label="Mostly snow / ice">
          <Select value={snow.v} onChange={(e) => snow.setV(e.target.value)}>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </Select>
        </Field>
      </Panel>
      <Button
        className="w-full"
        disabled={!elev.ok || !ts.ok || !vol.ok}
        onClick={() => {
          if (!elev.ok || !ts.ok || !vol.ok) return;
          const em = imperial ? elev.n * 0.3048 : elev.n;
          const bc = boilC(em);
          const tsc = imperial ? cFromF(ts.n) : ts.n;
          const kw = { 1: 0.5, 2: 1.1, 3: 1.0, 4: 1.7 }[stove.n] ?? 1;
          const dT = Math.max(0, bc - tsc);
          const q = heatEnergyKJ(vol.n, dT, snow.n === 1);
          const minutes = q / (kw * 60);
          let extra = "Once it rolls: 1 min. Above 2000 m / 6500 ft: 3 min.";
          if (stove.n === 3 || stove.n === 4) {
            let g = 12 * vol.n * (dT / 90);
            if (snow.n === 1) g += 10 * vol.n;
            extra = `Canister ~${Math.round(Math.max(g, 5))} g. ${extra}`;
          } else {
            extra = `Dry wood ~${((q / 0.15) / 16000).toFixed(2)} kg. ${extra}`;
          }
          setOut({ bc, min: minutes, extra });
        }}
      >
        Estimate
      </Button>
      {out ? (
        <Result
          items={[
            { k: "Boil", v: `${out.bc.toFixed(1)}°C / ${fFromC(out.bc).toFixed(1)}°F` },
            { k: "Time", v: `${Math.round(out.min)} min` },
          ]}
          note={out.extra}
        />
      ) : null}
    </div>
  );
}

export function ToolNeed() {
  const { system } = useUnits();
  const hrs = useNum("");
  const t = useNum(system === "us" ? "70" : "21");
  const hard = useNum("0");
  const snow = useNum("0");
  const [out, setOut] = useState<null | { need: number; snowL?: number }>(null);
  const imperial = system === "us";
  return (
    <div className="grid gap-4">
      <How>Floor about 2 L on a long day. Snow volume is not water volume.</How>
      <Eq>L/h = 0.35 + 0.012·max(0, F−55) + 0.25 hard work</Eq>
      <Panel className="grid gap-3">
        <Field label="Hours out">
          <NumInput value={hrs.v} onChange={(e) => hrs.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Air °F" : "Air °C"}>
          <NumInput value={t.v} onChange={(e) => t.setV(e.target.value)} />
        </Field>
        <Field label="Hard work">
          <Select value={hard.v} onChange={(e) => hard.setV(e.target.value)}>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </Select>
        </Field>
        <Field label="Snow type">
          <Select value={snow.v} onChange={(e) => snow.setV(e.target.value)}>
            <option value="0">Skip</option>
            <option value="10">Powder 10:1</option>
            <option value="5">Settled 5:1</option>
            <option value="3">Wet 3:1</option>
          </Select>
        </Field>
      </Panel>
      <Button
        className="w-full"
        disabled={!hrs.ok || !t.ok}
        onClick={() => {
          if (!hrs.ok || !t.ok) return;
          const tF = imperial ? t.n : fFromC(t.n);
          let rate = 0.35 + 0.012 * Math.max(0, tF - 55);
          if (hard.n === 1) rate += 0.25;
          if (tF < 40) rate = Math.max(rate, 0.25);
          const need = rate * Math.max(hrs.n, 0);
          setOut({
            need,
            snowL: snow.n > 0 ? need * snow.n : undefined,
          });
        }}
      >
        Estimate
      </Button>
      {out ? (
        <Result
          items={[
            { k: "Carry", v: `${out.need.toFixed(1)} L` },
            ...(out.snowL != null ? [{ k: "Snow to melt", v: `${Math.round(out.snowL)} L` }] : []),
          ]}
          note={out.need < 2 && (hrs.n ?? 0) >= 8 ? "Use 2 L anyway." : undefined}
        />
      ) : null}
    </div>
  );
}

export function ToolRiver() {
  const { system } = useUnits();
  const w = useNum("");
  const d = useNum("");
  const c = useNum("1");
  const [out, setOut] = useState<null | { no: boolean; why: string }>(null);
  const imperial = system === "us";
  return (
    <div className="grid gap-4">
      <How>
        Knee-deep and pushing current is a no. Fast water is a no. When in
        doubt, walk the bank.
      </How>
      <Panel className="grid gap-3">
        <Field label={imperial ? "Width ft" : "Width m"}>
          <NumInput value={w.v} onChange={(e) => w.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Depth ft" : "Depth m"}>
          <NumInput value={d.v} onChange={(e) => d.setV(e.target.value)} />
        </Field>
        <Field label="Current">
          <Select value={c.v} onChange={(e) => c.setV(e.target.value)}>
            <option value="1">Slow</option>
            <option value="2">Push</option>
            <option value="3">Fast</option>
          </Select>
        </Field>
      </Panel>
      <Button
        className="w-full"
        disabled={!w.ok || !d.ok}
        onClick={() => {
          if (!w.ok || !d.ok) return;
          const wf = imperial ? w.n : w.n * 3.28084;
          const df = imperial ? d.n : d.n * 3.28084;
          let no = false;
          let why = "Still a real risk. Unbuckle the pack belt.";
          if (df >= 2.5) {
            no = true;
            why = "Too deep.";
          }
          if (df >= 1.5 && c.n >= 2) {
            no = true;
            why = "Deep and pushing.";
          }
          if (c.n >= 3) {
            no = true;
            why = "Too fast.";
          }
          if (wf >= 80 && c.n >= 2) {
            no = true;
            why = "Wide moving water.";
          }
          setOut({ no, why });
        }}
      >
        Look
      </Button>
      {out ? (
        <Result
          items={[{ k: "Call", v: out.no ? "DO NOT FORD" : "Risk remains" }]}
          note={out.why}
          tone={out.no ? "danger" : "warn"}
        />
      ) : null}
    </div>
  );
}

export function ToolRope() {
  const strands = useNum("2");
  const pulleys = useNum("1");
  const load = useNum("");
  const mbs = useNum("");
  const knot = useNum("2");
  const wet = useNum("0");
  const age = useNum("2");
  const [out, setOut] = useState<null | Record<string, string>>(null);
  return (
    <div className="grid gap-4">
      <How>Pack haul only. Do not hang a person on this math.</How>
      <Eq>est MA = strands × 0.9^pulleys · WLL = MBS/SF × knot × wet × age</Eq>
      <Panel className="grid gap-3">
        <Field label="Support strands">
          <NumInput value={strands.v} onChange={(e) => strands.setV(e.target.value)} />
        </Field>
        <Field label="Pulleys / bends">
          <NumInput value={pulleys.v} onChange={(e) => pulleys.setV(e.target.value)} />
        </Field>
        <Field label="Load lb">
          <NumInput value={load.v} onChange={(e) => load.setV(e.target.value)} />
        </Field>
        <Field label="Rope MBS lb">
          <NumInput value={mbs.v} onChange={(e) => mbs.setV(e.target.value)} />
        </Field>
        <Field label="Knot">
          <Select value={knot.v} onChange={(e) => knot.setV(e.target.value)}>
            <option value="1">None / tensionless 1.00</option>
            <option value="2">Figure 8 ~0.80</option>
            <option value="3">Bowline ~0.70</option>
            <option value="4">Overhand ~0.50</option>
          </Select>
        </Field>
        <Field label="Wet nylon">
          <Select value={wet.v} onChange={(e) => wet.setV(e.target.value)}>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </Select>
        </Field>
        <Field label="Age">
          <Select value={age.v} onChange={(e) => age.setV(e.target.value)}>
            <option value="1">New</option>
            <option value="2">Used</option>
            <option value="3">Worn / unknown</option>
          </Select>
        </Field>
      </Panel>
      <Button
        className="w-full"
        disabled={!strands.ok || !load.ok || !mbs.ok}
        onClick={() => {
          if (!strands.ok || !load.ok || !mbs.ok) return;
          const kf = { 1: 1, 2: 0.8, 3: 0.7, 4: 0.5 }[knot.n] ?? 0.7;
          const wetF = wet.n === 1 ? 0.85 : 1;
          const af = { 1: 1, 2: 0.8, 3: 0.5 }[age.n] ?? 0.5;
          const ideal = Math.max(strands.n, 1);
          const actual = ideal * 0.9 ** Math.max(pulleys.n || 0, 0);
          const pull = load.n / actual;
          const w5 = (mbs.n / 5) * kf * wetF * af;
          const w10 = (mbs.n / 10) * kf * wetF * af;
          setOut({
            ideal: ideal.toFixed(2),
            actual: actual.toFixed(2),
            pull: String(Math.round(pull)),
            w5: String(Math.round(w5)),
            w10: String(Math.round(w10)),
            note:
              load.n > w10
                ? "OVER the life factor (MBS/10). Pick another plan."
                : load.n > w5
                  ? "OVER the utility factor (MBS/5). Fine for a pack, not for a person."
                  : "Under the utility factor. Still not a person hang.",
          });
        }}
      >
        Compare
      </Button>
      {out ? (
        <Result
          items={[
            { k: "Ideal MA", v: out.ideal },
            { k: "Est MA", v: out.actual },
            { k: "Pull", v: `${out.pull} lb` },
            { k: "Util WLL/5", v: `${out.w5} lb` },
            { k: "Life WLL/10", v: `${out.w10} lb` },
          ]}
          note={out.note}
          tone={out.note.startsWith("OVER") ? "danger" : "warn"}
        />
      ) : null}
    </div>
  );
}

export function ToolHang() {
  const { system } = useUnits();
  const span = useNum("");
  const branch = useNum("");
  const [out, setOut] = useState<null | { rope: number; ok: boolean }>(null);
  const imperial = system === "us";
  return (
    <div className="grid gap-4">
      <How>
        Bag 12 ft off the dirt, 6 ft from either trunk, 6 ft below the branch.
        That is the 12-foot rule. The branch has to be higher than 12 ft.
      </How>
      <Eq>rope ≈ span + 2·height + tail</Eq>
      <Panel className="grid gap-3">
        <Field label={imperial ? "Tree spacing ft" : "Tree spacing m"}>
          <NumInput value={span.v} onChange={(e) => span.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Branch height ft" : "Branch height m"}>
          <NumInput value={branch.v} onChange={(e) => branch.setV(e.target.value)} />
        </Field>
      </Panel>
      <Button
        className="w-full"
        disabled={!span.ok || !branch.ok}
        onClick={() => {
          if (!span.ok || !branch.ok) return;
          setOut(hangGeometry(span.n, branch.n, imperial));
        }}
      >
        Check
      </Button>
      {out ? (
        <Result
          items={[{ k: "Rope need", v: `~${Math.round(out.rope)}` }]}
          note={
            out.ok
              ? "12 / 6 / 6 is possible with this span and branch."
              : "Need a higher limb or a wider gap. Bag 12 ft up, 6 ft from the trunk, 6 ft below the limb."
          }
          tone={out.ok ? "ok" : "warn"}
        />
      ) : null}
    </div>
  );
}

export function ToolBattery() {
  const vr = useNum("");
  const vc = useNum("0");
  const vu = useNum("0");
  const [out, setOut] = useState<string[] | null>(null);
  return (
    <div className="grid gap-4">
      <How>Flooded lead-acid. Sit 30 minutes before rest voltage. Clean the cables first.</How>
      <Eq>12.66 full · 12.4 ~75% · 12.2 ~50% · 12.0 ~25% · crank under 10.5 weak · run 13.7–14.7 charging</Eq>
      <Panel className="grid gap-3">
        <Field label="Rest volts">
          <NumInput value={vr.v} onChange={(e) => vr.setV(e.target.value)} />
        </Field>
        <Field label="Crank volts (0 skip)">
          <NumInput value={vc.v} onChange={(e) => vc.setV(e.target.value)} />
        </Field>
        <Field label="Running volts (0 skip)">
          <NumInput value={vu.v} onChange={(e) => vu.setV(e.target.value)} />
        </Field>
      </Panel>
      <Button
        className="w-full"
        onClick={() => {
          if (!vr.ok) return;
          const lines: string[] = [];
          if (vr.n >= 12.65) lines.push("Rest: full");
          else if (vr.n >= 12.4) lines.push("Rest: ~75%");
          else if (vr.n >= 12.2) lines.push("Rest: ~50%");
          else if (vr.n >= 12.0) lines.push("Rest: ~25%");
          else lines.push("Rest: dead/low");
          if (vc.ok && vc.n > 0) {
            lines.push(vc.n < 9.6 ? "Crank: very weak" : vc.n < 10.5 ? "Crank: weak" : "Crank: holds");
          }
          if (vu.ok && vu.n > 0) {
            lines.push(vu.n < 13.2 ? "Run: not charging" : vu.n <= 14.8 ? "Run: charging" : "Run: too high — regulator");
          }
          setOut(lines);
        }}
      >
        Read
      </Button>
      {out ? <Result items={out.map((l) => ({ k: l.split(":")[0], v: l.split(":").slice(1).join(":").trim() }))} /> : null}
    </div>
  );
}

export function ToolFuel() {
  const mode = useNum("1");
  const mi = useNum("");
  const gal = useNum("");
  const mpg = useNum("");
  const left = useNum("");
  const needm = useNum("");
  const hrs = useNum("");
  const [out, setOut] = useState<{ items: { k: string; v: string }[]; note?: string; tone?: "ok" | "warn" | "danger" } | null>(null);
  return (
    <div className="grid gap-4">
      <How>
        Use what this tank actually burned. Hills, idle, and cold starts lie.
        Keep 20% in your head. Numbers are US gallons and miles.
      </How>
      <Eq>MPG = mi/gal · L/100km = 235.215/MPG · range = gal_left × MPG · GPH = gal/hours</Eq>
      <Field label="Mode">
        <Select value={mode.v} onChange={(e) => mode.setV(e.target.value)}>
          <option value="1">From a fill</option>
          <option value="2">Range check</option>
          <option value="3">Burn vs hours</option>
        </Select>
      </Field>
      <Panel className="grid gap-3">
        {mode.n === 1 ? (
          <>
            <Field label="Miles driven">
              <NumInput value={mi.v} onChange={(e) => mi.setV(e.target.value)} />
            </Field>
            <Field label="Gallons used">
              <NumInput value={gal.v} onChange={(e) => gal.setV(e.target.value)} />
            </Field>
            <Field label="Gallons left now">
              <NumInput value={left.v} onChange={(e) => left.setV(e.target.value)} />
            </Field>
          </>
        ) : null}
        {mode.n === 2 ? (
          <>
            <Field label="Known MPG">
              <NumInput value={mpg.v} onChange={(e) => mpg.setV(e.target.value)} />
            </Field>
            <Field label="Gallons left">
              <NumInput value={left.v} onChange={(e) => left.setV(e.target.value)} />
            </Field>
            <Field label="Miles to go">
              <NumInput value={needm.v} onChange={(e) => needm.setV(e.target.value)} />
            </Field>
          </>
        ) : null}
        {mode.n === 3 ? (
          <>
            <Field label="Gallons used">
              <NumInput value={gal.v} onChange={(e) => gal.setV(e.target.value)} />
            </Field>
            <Field label="Hours running">
              <NumInput value={hrs.v} onChange={(e) => hrs.setV(e.target.value)} />
            </Field>
            <Field label="Gallons left">
              <NumInput value={left.v} onChange={(e) => left.setV(e.target.value)} />
            </Field>
          </>
        ) : null}
      </Panel>
      <Button
        className="w-full"
        onClick={() => {
          if (mode.n === 1 && mi.ok && gal.ok && gal.n > 0) {
            const m = mpgFromFill(mi.n, gal.n);
            const L = left.ok ? left.n : 0;
            setOut({
              items: [
                { k: "MPG", v: m.toFixed(2) },
                { k: "L/100km", v: lPer100(m).toFixed(1) },
                { k: "Range", v: `${Math.round(L * m)} mi` },
                { k: "Reserve 20%", v: `${Math.round(L * m * 0.8)} mi` },
              ],
            });
          } else if (mode.n === 2 && mpg.ok && mpg.n > 0 && left.ok && needm.ok) {
            const needg = needm.n / mpg.n;
            const thin = needg > left.n * 0.8;
            setOut({
              items: [
                { k: "Need", v: `${needg.toFixed(2)} gal` },
                { k: "Have", v: `${left.n.toFixed(2)} gal` },
                { k: "Range", v: `${Math.round(left.n * mpg.n)} mi` },
              ],
              note: thin ? "THIN. Find fuel." : `Margin ${ (left.n - needg).toFixed(2) } gal.`,
              tone: thin ? "danger" : "ok",
            });
          } else if (mode.n === 3 && gal.ok && hrs.ok && hrs.n > 0) {
            const gph = gal.n / hrs.n;
            setOut({
              items: [
                { k: "GPH", v: gph.toFixed(2) },
                { k: "Hours left", v: left.ok && gph > 0 ? (left.n / gph).toFixed(1) : "—" },
              ],
            });
          }
        }}
      >
        Compute
      </Button>
      {out ? <Result items={out.items} note={out.note} tone={out.tone} /> : null}
    </div>
  );
}

function Card({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="grid gap-3">
      <How>{title}</How>
      <ul className="grid gap-2 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed">
        {lines.map((l) => (
          <li key={l} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ToolAvpu() {
  const c = useNum("1");
  const label = useMemo(
    () =>
      ({ 1: "A Alert", 2: "V Voice", 3: "P Pain", 4: "U Unresponsive" })[c.n] ?? "?",
    [c.n],
  );
  return (
    <div className="grid gap-4">
      <How>
        Best response now. P or U: the airway is the job. Approximate GCS: A
        14–15, V 10–13, P 7–9, U 3–6. Write the letter, not just “awake.”
      </How>
      <Field label="Best now">
        <Select value={c.v} onChange={(e) => c.setV(e.target.value)}>
          <option value="1">A — Alert</option>
          <option value="2">V — Voice only</option>
          <option value="3">P — Pain only</option>
          <option value="4">U — Unresponsive</option>
        </Select>
      </Field>
      <Result
        items={[{ k: "AVPU", v: label }]}
        note={c.n >= 3 ? "Protect the airway. Recovery position if breathing and no spine reason not to." : "Re-check. Serial scores matter."}
        tone={c.n >= 3 ? "danger" : "ok"}
      />
    </div>
  );
}

export function ToolGcs() {
  const e = useNum("4");
  const v = useNum("5");
  const m = useNum("6");
  const g = Math.min(4, Math.max(1, e.n || 1)) + Math.min(5, Math.max(1, v.n || 1)) + Math.min(6, Math.max(1, m.n || 1));
  return (
    <div className="grid gap-4">
      <How>Best eye, verbal, motor. Record E+V+M, not just the total. ≤8 is airway worry. Serial scores beat one number.</How>
      <Eq>GCS = E + V + M (3–15) · 13–15 mild · 9–12 moderate · 3–8 severe</Eq>
      <Panel className="grid gap-3">
        <Field label="Eye">
          <Select value={e.v} onChange={(ev) => e.setV(ev.target.value)}>
            <option value="4">4 Spontaneous</option>
            <option value="3">3 To voice</option>
            <option value="2">2 To pain</option>
            <option value="1">1 None</option>
          </Select>
        </Field>
        <Field label="Verbal">
          <Select value={v.v} onChange={(ev) => v.setV(ev.target.value)}>
            <option value="5">5 Oriented</option>
            <option value="4">4 Confused</option>
            <option value="3">3 Words</option>
            <option value="2">2 Sounds</option>
            <option value="1">1 None</option>
          </Select>
        </Field>
        <Field label="Motor">
          <Select value={m.v} onChange={(ev) => m.setV(ev.target.value)}>
            <option value="6">6 Obeys</option>
            <option value="5">5 Localizes</option>
            <option value="4">4 Withdraws</option>
            <option value="3">3 Flexion</option>
            <option value="2">2 Extension</option>
            <option value="1">1 None</option>
          </Select>
        </Field>
      </Panel>
      <Result
        items={[
          { k: "Score", v: `E${e.v} V${v.v} M${m.v}` },
          { k: "Total", v: String(g) },
        ]}
        note={g <= 8 ? "SEVERE. Airway." : g <= 12 ? "MODERATE. Watch." : "MILD. Re-check."}
        tone={g <= 8 ? "danger" : g <= 12 ? "warn" : "ok"}
      />
    </div>
  );
}

function CountTool({
  label,
  how,
  adult,
}: {
  label: string;
  how: string;
  adult: (rate: number) => { note: string; tone: "ok" | "warn" | "danger" };
}) {
  const n = useNum("");
  const typed = useNum("");
  const [sec, setSec] = useState<number | null>(null);
  const used = sec ?? (typed.ok ? typed.n : null);
  const rate = used && used > 0 && n.ok ? (n.n * 60) / used : null;
  const extra = rate != null ? adult(rate) : null;
  return (
    <div className="grid gap-4">
      <How>{how}</How>
      <Eq>rate = count × 60 / seconds</Eq>
      <FieldTimer label={label} onStop={setSec} />
      <Field label="Or type seconds">
        <NumInput value={typed.v} onChange={(e) => typed.setV(e.target.value)} />
      </Field>
      <Field label="Count">
        <NumInput value={n.v} onChange={(e) => n.setV(e.target.value)} />
      </Field>
      {rate != null && extra ? (
        <Result
          items={[
            { k: "Rate", v: `${Math.round(rate)} /min` },
            { k: "Window", v: `${used?.toFixed(1)} s` },
          ]}
          note={extra.note}
          tone={extra.tone}
        />
      ) : null}
    </div>
  );
}

export function ToolPulse() {
  return (
    <CountTool
      label="Pulse"
      how="Start, count beats, stop, enter the count. Adult rest ~60–100. Shock is fast and weak. Carotid if radial is gone."
      adult={(bpm) =>
        bpm < 50
          ? { note: "Slow. Are they perfusing?", tone: "warn" }
          : bpm > 120
            ? { note: "Fast. Shock, pain, or heat.", tone: "danger" }
            : bpm > 100
              ? { note: "High. Work or stress.", tone: "warn" }
              : { note: "Adult rest band.", tone: "ok" }
      }
    />
  );
}

export function ToolResp() {
  return (
    <CountTool
      label="Respirations"
      how="Watch the chest. Do not tell them you are counting. Adult ~12–20. Child higher. Infant often 30–60."
      adult={(rr) =>
        rr < 10
          ? { note: "SLOW. Airway or head until proven otherwise.", tone: "danger" }
          : rr > 30
            ? { note: "FAST. Find why.", tone: "danger" }
            : rr > 20
              ? { note: "High for adult rest.", tone: "warn" }
              : { note: "Adult rest band.", tone: "ok" }
      }
    />
  );
}

export function ToolMarch() {
  return (
    <Card
      title="TCCC order. Massive bleed, airway, respirations, circulation, hypothermia."
      lines={[
        "M — Massive bleed first. Limb: tourniquet high. Junction: pack and press.",
        "A — Airway. Talking? Airway is open. If not: position, sweep, recovery.",
        "R — Respirations. Chest rise both sides. Seal holes. Watch tension signs.",
        "C — Circulation. Radial pulse? Skin? Stop lesser bleeding.",
        "H — Hypothermia and head. Keep them warm. Cold casualties clot worse.",
      ]}
    />
  );
}

export function ToolShock() {
  return (
    <Card
      title="You do not measure percent in the dirt. You treat the bleed and the cold."
      lines={[
        "Look: fast weak pulse, pale or cool skin, anxious then quiet, thirst, radial fading.",
        "Class I: under 15% lost — pulse may still look normal.",
        "Class II: 15–30% — heart rate up.",
        "Class III: 30–40% — blood pressure down.",
        "Class IV: over 40% — they are dying. Bleed control is the treatment.",
        "Flat if they can breathe. Keep warm.",
      ]}
    />
  );
}

export function ToolBurns() {
  return (
    <Card
      title="Adult rule of nines. Do not use adult nines on a child. Fluids are a medic job."
      lines={[
        "Head 9. Each arm 9. Chest 18. Back 18. Each leg 18. Groin 1. Palm plus fingers ~1%.",
        "Cool running water if you have it, then cover. Do not pack ice on it.",
        "Face, soot, singed hair: watch the airway. It swells later.",
      ]}
    />
  );
}

export function ToolMist() {
  return (
    <Card
      title="Say it twice so they hear it. Write it on tape on the chest."
      lines={[
        "M — Mechanism.",
        "I — Injuries you found.",
        "S — Signs: AVPU, GCS, HR, RR, skin, bleed status.",
        "T — Treatment you did.",
      ]}
    />
  );
}

export function ToolVitals() {
  return (
    <Card
      title="One vital is a snapshot. Trend is the story."
      lines={[
        "Adult HR 60–100. Adult RR 12–20. Adult SBP ~90–140.",
        "Child HR faster. Infant RR 30–60.",
        "Pupils: equal, react. PEARL is a look, not a diagnosis.",
      ]}
    />
  );
}

export function ToolExposure() {
  const { system } = useUnits();
  const t = useNum(system === "us" ? "40" : "4");
  const v = useNum("10");
  const rh = useNum("50");
  const wet = useNum("0");
  const move = useNum("1");
  const hrs = useNum("2");
  const [out, setOut] = useState<null | { score: number; note: string; frost: string }>(null);
  const imperial = system === "us";
  return (
    <div className="grid gap-4">
      <How>Wet clothing dumps heat fast. Score the scene you have, then act.</How>
      <Panel className="grid gap-3">
        <Field label={imperial ? "Air °F" : "Air °C"}>
          <NumInput value={t.v} onChange={(e) => t.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Wind mph" : "Wind km/h"}>
          <NumInput value={v.v} onChange={(e) => v.setV(e.target.value)} />
        </Field>
        <Field label="RH %">
          <NumInput value={rh.v} onChange={(e) => rh.setV(e.target.value)} />
        </Field>
        <Field label="Clothes wet">
          <Select value={wet.v} onChange={(e) => wet.setV(e.target.value)}>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </Select>
        </Field>
        <Field label="Still moving">
          <Select value={move.v} onChange={(e) => move.setV(e.target.value)}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </Select>
        </Field>
        <Field label="Hours exposed">
          <NumInput value={hrs.v} onChange={(e) => hrs.setV(e.target.value)} />
        </Field>
      </Panel>
      <Button
        className="w-full"
        onClick={() => {
          if (!t.ok || !v.ok) return;
          const tF = imperial ? t.n : fFromC(t.n);
          const mph = imperial ? v.n : v.n * 0.621371;
          const wct = windChillF(tF, mph);
          let score = 0;
          if (tF <= 50) score += 2;
          if (tF <= 32) score += 2;
          if (wct <= 0) score += 2;
          if (wet.n === 1) score += 3;
          if (move.n === 0) score += 2;
          if ((hrs.n || 0) >= 3) score += 1;
          if ((hrs.n || 0) >= 8) score += 1;
          let note = "Watch the trend.";
          if (score >= 8) note = "HIGH. Shelter. Fire. Get dry NOW.";
          else if (score >= 5) note = "Rising. Eat. Cover.";
          if (tF >= 85) note += " Heat is also a killer. Water. Shade. Slow.";
          setOut({ score, note, frost: frostbiteNote(tF, wct) });
        }}
      >
        Score
      </Button>
      {out ? (
        <Result
          items={[
            { k: "Cold score", v: `${out.score} / 12` },
            { k: "Frostbite", v: out.frost },
          ]}
          note={out.note}
          tone={out.score >= 8 ? "danger" : out.score >= 5 ? "warn" : "ok"}
        />
      ) : null}
    </div>
  );
}

export function ToolStop() {
  return (
    <Card
      title="You are not thinking yet. Sit down."
      lines={[
        "S — Sit. Stop making it worse.",
        "T — Think the next threat: bleed, cold, dark, terrain, searchers.",
        "O — Observe ground, sky, noise, your people.",
        "P — Plan one hour. Not the whole war.",
        "Rule of 3: air minutes, shelter in severe hours, water days, food weeks.",
        "Lost and people will look: STAY. Mark the hole. Walk only with a reason that survives daylight.",
      ]}
    />
  );
}

export function ToolPriorities() {
  return (
    <Card
      title="Professionals get small, get dry, get found."
      lines={[
        "1 Security / bleeding",
        "2 Airway / breathing",
        "3 Shelter from wind",
        "4 Fire / dry / heat",
        "5 Water you can treat",
        "6 Signal / stay found",
        "7 Food is last",
        "Heroes walk at night and twist an ankle.",
      ]}
    />
  );
}

export function ToolSignal() {
  return (
    <Card
      title="Contrast beats pretty. Stay by the signal."
      lines={[
        "Three of anything is help: whistle, smoke, light.",
        "Shots in threes only if that is the plan and you can spare the ammo.",
        "Open ground. Put the signal where a plane can see it. Mirror across the aircraft's path.",
        "Stay by it. A moving person is hard to find.",
      ]}
    />
  );
}

export function ToolLost() {
  return (
    <Card
      title="Do not wander a new last-known point."
      lines={[
        "Last known point is gold.",
        "Use a linear: ridge, creek, road. Do not contour-hope in thick laurel.",
        "Night: STOP unless the ground will kill you where you sit.",
        "Leave sign if you move: arrows, breaks, notes.",
      ]}
    />
  );
}

export function ToolEqns() {
  return (
    <Card
      title="What the math actually is."
      lines={[
        "Sound c = 331.3 √(Tk/273.15) m/s · d = c·t",
        "Dewpoint Magnus 17.27 / 237.3",
        "LCL 125 m per °C of T−Td",
        "WCT NWS 2001 · HI Rothfusz · Tw Stull 2011",
        "Naismith 3 mph + 2000 ft/h · GPS track fills dist/climb",
        "Mifflin-St Jeor BMR · walk 0.55–1.05 kcal/kg/km · climb 0.007 kcal/kg/m",
        "Boil −1°C / 300 m · Q = m·4.184·ΔT kJ · ice +334 kJ/kg",
        "MPG = mi/gal · GCS = E+V+M · HR = count×60/t",
        "Slope: two GPS marks or pitch tan · pace calib from GPS 100",
        "Resection: reverse rays from two known marks; cut at you · GPS is a check",
      ]}
    />
  );
}
