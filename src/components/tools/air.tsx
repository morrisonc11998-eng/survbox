import { useState } from "react";
import { Field, NumInput, Select, Panel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FieldTimer } from "@/components/timer";
import { Eq, How, Result } from "@/components/result";
import { useUnits } from "@/lib/survbox/units";
import { useNum } from "@/lib/survbox/num";
import { fmtTemp, usePhoneSensors } from "@/lib/survbox/sensors";
import {
  cFromF,
  cloudBaseM,
  dewpointC,
  fFromC,
  frostbiteNote,
  heatIndexF,
  popEst,
  rhFromTd,
  soundRange,
  wetBulbC,
  windChillF,
} from "@/lib/survbox/math";

function PhoneWeatherFill({
  onTempC,
  onTrend,
}: {
  onTempC?: (c: number) => void;
  onTrend?: (t: -1 | 0 | 1) => void;
}) {
  const s = usePhoneSensors();
  const { system } = useUnits();
  const imperial = system === "us";
  const tempC = s.live.tempC ?? s.fix?.tempC;
  const hpa = s.live.pressureHpa ?? s.fix?.pressureHpa;
  const trend = s.pressureTrend();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <p className="min-w-0 text-xs leading-relaxed text-muted">
        {tempC != null
          ? `Phone ${fmtTemp(tempC, imperial)} (case / ambient).`
          : "No air thermometer — type it."}{" "}
        {hpa != null ? `${hpa.toFixed(1)} hPa.` : "No barometer yet."}
        {trend === -1 ? " Falling." : trend === 1 ? " Rising." : trend === 0 ? " Steady." : ""}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" className="px-3" onClick={() => void s.arm()}>
          {s.armed ? "Live" : "Use phone"}
        </Button>
        {onTempC && tempC != null ? (
          <Button variant="secondary" className="px-3" onClick={() => onTempC(tempC)}>
            Fill temp
          </Button>
        ) : null}
        {onTrend && trend != null ? (
          <Button variant="secondary" className="px-3" onClick={() => onTrend(trend)}>
            Fill trend
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function AirIn() {
  const { system } = useUnits();
  const t = useNum("70");
  const moisture = useNum("1");
  const td = useNum("55");
  const rh = useNum("65");
  const imperial = system === "us";
  const tC = imperial ? cFromF(t.n) : t.n;
  let tdC = imperial ? cFromF(td.n) : td.n;
  let rhV = rh.n;
  if (moisture.n === 2 && rh.ok && t.ok) {
    tdC = dewpointC(tC, rh.n);
    rhV = rh.n;
  } else if (t.ok && td.ok) {
    rhV = rhFromTd(tC, tdC);
  }
  return { t, moisture, td, rh, imperial, tC, tdC, rhV, ready: t.ok };
}

export function ToolPop() {
  const air = AirIn();
  const trend = useNum("0");
  const [out, setOut] = useState<null | { pop: number; rh: number; td: number }>(null);
  return (
    <div className="grid gap-4">
      <How>
        Type air temp and either dewpoint or RH. Falling pressure adds rain chance.
        Tight T−Td means the air is already wet. Fill temp and trend from the phone
        if it has a thermometer and a barometer.
      </How>
      <Eq>score = 80 − 12(T−Td) + RH/P bumps, clamp 5–95%</Eq>
      <PhoneWeatherFill
        onTempC={(c) => air.t.setV((air.imperial ? fFromC(c) : c).toFixed(1))}
        onTrend={(t) => trend.setV(String(t))}
      />
      <AirFields air={air} />
      <Field label="Pressure trend">
        <Select value={trend.v} onChange={(e) => trend.setV(e.target.value)}>
          <option value="-1">Falling</option>
          <option value="0">Steady</option>
          <option value="1">Rising</option>
        </Select>
      </Field>
      <Button
        className="w-full"
        onClick={() => {
          if (!air.ready) return;
          setOut({
            pop: popEst(air.tC, air.tdC, air.rhV, trend.n),
            rh: air.rhV,
            td: air.imperial ? fFromC(air.tdC) : air.tdC,
          });
        }}
      >
        Estimate PoP
      </Button>
      {out ? (
        <Result
          items={[
            { k: "Est. PoP", v: `${out.pop}%` },
            { k: air.imperial ? "Dewpoint °F" : "Dewpoint °C", v: out.td.toFixed(1) },
            { k: "RH", v: `${Math.round(out.rh)}%` },
          ]}
          note="Small T−Td = wetter air. A forecast still beats this guess. Phone temp is a case temp — shade it."
        />
      ) : null}
    </div>
  );
}

function AirFields({ air }: { air: ReturnType<typeof AirIn> }) {
  return (
    <Panel className="grid gap-3">
      <Field label={air.imperial ? "Air temp °F" : "Air temp °C"}>
        <NumInput value={air.t.v} onChange={(e) => air.t.setV(e.target.value)} />
      </Field>
      <Field label="Moisture">
        <Select value={air.moisture.v} onChange={(e) => air.moisture.setV(e.target.value)}>
          <option value="1">Dewpoint</option>
          <option value="2">Relative humidity %</option>
        </Select>
      </Field>
      {air.moisture.n === 2 ? (
        <Field label="RH %">
          <NumInput value={air.rh.v} onChange={(e) => air.rh.setV(e.target.value)} />
        </Field>
      ) : (
        <Field label={air.imperial ? "Dewpoint °F" : "Dewpoint °C"}>
          <NumInput value={air.td.v} onChange={(e) => air.td.setV(e.target.value)} />
        </Field>
      )}
    </Panel>
  );
}

export function ToolCloud() {
  const air = AirIn();
  const [out, setOut] = useState<null | { m: number; note: string }>(null);
  return (
    <div className="grid gap-4">
      <How>
        Same air inputs. Cloud base is the lifted condensation level — how far a
        parcel has to rise before it condenses. When the hills start disappearing,
        this number is already small.
      </How>
      <Eq>H_m ≈ 125 × (T − Td) · H_ft ≈ 227 × (Tf − Tdf)</Eq>
      <PhoneWeatherFill
        onTempC={(c) => air.t.setV((air.imperial ? fFromC(c) : c).toFixed(1))}
      />
      <AirFields air={air} />
      <Button
        className="w-full"
        onClick={() => {
          if (!air.ready) return;
          const m = cloudBaseM(air.tC, air.tdC);
          const note =
            m < 300 ? "Low deck. Terrain disappears." : m < 1000 ? "Ceiling coming down." : "Base still usable.";
          setOut({ m, note });
        }}
      >
        Estimate base
      </Button>
      {out ? (
        <Result
          items={[
            { k: "Base", v: `${Math.round(out.m)} m / ${Math.round(out.m * 3.28084)} ft` },
          ]}
          note={out.note}
          tone={out.m < 300 ? "danger" : out.m < 1000 ? "warn" : "ok"}
        />
      ) : null}
    </div>
  );
}

export function ToolHeat() {
  const air = AirIn();
  const [out, setOut] = useState<null | { twC: number; hi?: number; note: string }>(null);
  return (
    <div className="grid gap-4">
      <How>
        Wet-bulb is what the air can actually cool you to. Heat index is only
        honest at 80°F and up. If wet-bulb is ugly, slow the work.
      </How>
      <Eq>Tw Stull 2011 · HI Rothfusz (T ≥ 80°F)</Eq>
      <PhoneWeatherFill
        onTempC={(c) => air.t.setV((air.imperial ? fFromC(c) : c).toFixed(1))}
      />
      <AirFields air={air} />
      <Button
        className="w-full"
        onClick={() => {
          if (!air.ready) return;
          const twC = wetBulbC(air.tC, air.rhV);
          const tF = air.imperial ? air.t.n : fFromC(air.tC);
          let hi: number | undefined;
          let note = "Heat index skipped below 80°F.";
          if (tF >= 80) {
            hi = heatIndexF(tF, air.rhV);
            note = hi >= 105 ? "DANGER. Work halt." : hi >= 90 ? "Slow the work." : "Heat building.";
          }
          if (twC >= 28) note = "Wet-bulb is ugly. " + note;
          setOut({ twC, hi, note });
        }}
      >
        Compute
      </Button>
      {out ? (
        <Result
          items={[
            { k: "Wet-bulb", v: `${out.twC.toFixed(1)}°C / ${fFromC(out.twC).toFixed(1)}°F` },
            ...(out.hi != null ? [{ k: "Heat index", v: `${Math.round(out.hi)}°F` }] : []),
          ]}
          note={out.note}
          tone={out.twC >= 28 || (out.hi ?? 0) >= 105 ? "danger" : "ok"}
        />
      ) : null}
    </div>
  );
}

export function ToolChill() {
  const { system } = useUnits();
  const t = useNum("20");
  const v = useNum("15");
  const [out, setOut] = useState<null | { wct: number; tF: number; note: string }>(null);
  const imperial = system === "us";
  return (
    <div className="grid gap-4">
      <How>
        Wind chill is how fast you lose heat. It does not freeze water colder
        than the actual air. Frostbite still needs air below 32°F. Hypothermia
        does not.
      </How>
      <Eq>WCT = 35.74 + 0.6215T − 35.75V^0.16 + 0.4275 T V^0.16 (T°F, V mph)</Eq>
      <PhoneWeatherFill
        onTempC={(c) => t.setV((imperial ? fFromC(c) : c).toFixed(1))}
      />
      <Panel className="grid gap-3">
        <Field label={imperial ? "Air temp °F" : "Air temp °C"}>
          <NumInput value={t.v} onChange={(e) => t.setV(e.target.value)} />
        </Field>
        <Field label={imperial ? "Wind mph" : "Wind km/h"}>
          <NumInput value={v.v} onChange={(e) => v.setV(e.target.value)} />
        </Field>
      </Panel>
      <Button
        className="w-full"
        onClick={() => {
          if (!t.ok || !v.ok) return;
          const tF = imperial ? t.n : fFromC(t.n);
          const mph = imperial ? v.n : v.n * 0.621371;
          const wct = windChillF(tF, mph);
          setOut({ wct, tF, note: frostbiteNote(tF, wct) });
        }}
      >
        Compute
      </Button>
      {out ? (
        <Result
          items={[
            { k: "Wind chill", v: `${Math.round(out.wct)}°F / ${cFromF(out.wct).toFixed(1)}°C` },
          ]}
          note={out.note}
          tone={out.wct <= -18 ? "danger" : out.tF < 32 ? "warn" : "ok"}
        />
      ) : null}
    </div>
  );
}

function SoundTool({
  titleHow,
  eq,
  timerLabel,
  after,
}: {
  titleHow: string;
  eq: string;
  timerLabel: string;
  after: (miles: number) => { note: string; tone: "ok" | "warn" | "danger" };
}) {
  const { system } = useUnits();
  const t = useNum(system === "us" ? "68" : "20");
  const typed = useNum("");
  const [sec, setSec] = useState<number | null>(null);
  const imperial = system === "us";
  const tC = imperial ? cFromF(t.n) : t.n;
  const used = sec ?? (typed.ok ? typed.n : null);
  const r = used != null && t.ok ? soundRange(used, tC) : null;
  const extra = r ? after(r.miles) : null;
  return (
    <div className="grid gap-4">
      <How>{titleHow}</How>
      <Eq>{eq}</Eq>
      <PhoneWeatherFill
        onTempC={(c) => t.setV((imperial ? fFromC(c) : c).toFixed(1))}
      />
      <Field label={imperial ? "Air temp °F" : "Air temp °C"}>
        <NumInput value={t.v} onChange={(e) => t.setV(e.target.value)} />
      </Field>
      <FieldTimer label={timerLabel} onStop={setSec} />
      <Field label="Or type seconds">
        <NumInput value={typed.v} onChange={(e) => typed.setV(e.target.value)} placeholder="0.00" />
      </Field>
      {r && extra ? (
        <Result
          items={[
            { k: "c", v: `${r.c.toFixed(1)} m/s` },
            { k: "Range", v: `${r.miles.toFixed(2)} mi / ${r.km.toFixed(2)} km` },
            { k: "Yards", v: `${Math.round(r.yards)}` },
            { k: "Time", v: `${used?.toFixed(2)} s` },
          ]}
          note={extra.note}
          tone={extra.tone}
        />
      ) : null}
    </div>
  );
}

export function ToolLightning() {
  return (
    <SoundTool
      titleHow="Start on the flash. Stop on the boom. 30-30 rule: if flash-to-bang is under 30 seconds, stay put 30 minutes after the last thunder. Cold air is slower than the 'divide by 5' rule."
      eq="d = c(T)·t   c = 331.3 √(Tk / 273.15)"
      timerLabel="Flash → bang"
      after={(miles) =>
        miles <= 6
          ? { note: "Inside the kill zone. Get off high ground.", tone: "danger" }
          : miles <= 10
            ? { note: "Close. Get inside. Still not safe on a ridge.", tone: "warn" }
            : { note: "Still not safe on a ridge.", tone: "ok" }
      }
    />
  );
}

export function ToolShot() {
  const mode = useNum("1");
  return (
    <div className="grid gap-4">
      <How>
        Supersonic round: CRACK is the shock cone off the bullet path. BOOM is
        the muzzle blast. Crack-to-boom is not range to the shooter. Useful range
        is muzzle flash to boom — if you saw the flash. One shot. Do not stand up
        for a better time.
      </How>
      <Field label="What you timed">
        <Select value={mode.v} onChange={(e) => mode.setV(e.target.value)}>
          <option value="1">Muzzle flash → boom (range)</option>
          <option value="2">Crack → boom (not range)</option>
        </Select>
      </Field>
      <SoundTool
        titleHow={
          mode.n === 1
            ? "If you missed the flash, you do not have range."
            : "Crack arrives from the nearest point on the path. Treat as a warning only."
        }
        eq="d = c(T)·t  — same as thunder. Temperature matters."
        timerLabel={mode.n === 1 ? "Flash → boom" : "Crack → boom"}
        after={() =>
          mode.n === 1
            ? { note: "Flash range only if you saw the muzzle.", tone: "warn" }
            : { note: "NOT shooter distance. Do not walk that azimuth as fact.", tone: "danger" }
        }
      />
    </div>
  );
}
