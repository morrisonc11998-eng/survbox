/** Treat all provided data as an estimate. */

export function cFromF(t: number) {
  return ((t - 32) * 5) / 9;
}
export function fFromC(t: number) {
  return (t * 9) / 5 + 32;
}

export function dewpointC(tC: number, rh: number) {
  const r = Math.max(1, Math.min(100, rh));
  const g = (17.27 * tC) / (tC + 237.3) + Math.log(r / 100);
  const den = 17.27 - g;
  if (den === 0) return tC;
  return (237.3 * g) / den;
}

export function rhFromTd(tC: number, tdC: number) {
  const es = Math.exp((17.27 * tC) / (tC + 237.3));
  const e = Math.exp((17.27 * tdC) / (tdC + 237.3));
  if (es === 0) return 50;
  return Math.max(1, Math.min(100, (100 * e) / es));
}

/** Stull 2011 wet-bulb, T in C, RH % */
export function wetBulbC(tC: number, rh: number) {
  const r = Math.max(1, Math.min(99, rh));
  return (
    tC * Math.atan(0.151977 * Math.sqrt(r + 8.313659)) +
    Math.atan(tC + r) -
    Math.atan(r - 1.676331) +
    0.00391838 * r ** 1.5 * Math.atan(0.023101 * r) -
    4.686035
  );
}

/** Rothfusz heat index, T in F */
export function heatIndexF(tF: number, rh: number) {
  const t = tF;
  const r = rh;
  let hi =
    -42.379 +
    2.04901523 * t +
    10.14333127 * r -
    0.22475541 * t * r -
    0.00683783 * t * t -
    0.05481717 * r * r +
    0.00122874 * t * t * r +
    0.00085282 * t * r * r -
    0.00000199 * t * t * r * r;
  if (r < 13 && t >= 80 && t <= 112) {
    hi -= ((13 - r) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
  }
  if (r > 85 && t >= 80 && t <= 87) {
    hi += ((r - 85) / 10) * ((87 - t) / 5);
  }
  return hi;
}

/** NWS 2001 wind chill. T F, V mph. Valid T<=50 and V>=3 */
export function windChillF(tF: number, vMph: number) {
  const v = Math.max(vMph, 0);
  if (v < 3 || tF > 50) return tF;
  return 35.74 + 0.6215 * tF - 35.75 * v ** 0.16 + 0.4275 * tF * v ** 0.16;
}

export function frostbiteNote(tF: number, wct: number) {
  if (tF >= 32) return "No freeze (air ≥ 32°F). Hypothermia still possible.";
  if (wct > -18) return "Frostbite not soon.";
  if (wct > -31) return "Frostbite ~30 min.";
  if (wct > -50) return "Frostbite ~10 min.";
  return "Frostbite ~5 min.";
}

export function popEst(tC: number, tdC: number, rh: number, ptrend: number) {
  const dd = Math.max(0, tC - tdC);
  let s = 80 - 12 * dd;
  if (rh >= 80) s += 8;
  if (ptrend < 0) s += 10;
  else if (ptrend > 0) s -= 8;
  return Math.round(Math.max(5, Math.min(95, s)));
}

/** Speed of sound m/s. c = 331.3 * sqrt(Tk / 273.15) */
export function speedOfSound(tC: number) {
  let tk = tC + 273.15;
  if (tk <= 0) tk = 273.15;
  return 331.3 * Math.sqrt(tk / 273.15);
}

export function soundRange(sec: number, tC: number) {
  const c = speedOfSound(tC);
  const meters = c * sec;
  return {
    c,
    meters,
    km: meters / 1000,
    miles: meters / 1609.34,
    yards: meters * 1.09361,
  };
}

export function cloudBaseM(tC: number, tdC: number) {
  return 125 * Math.max(0, tC - tdC);
}

export function slopeStats(rise: number, run: number) {
  const grade = (100 * rise) / run;
  const angle = (Math.atan(rise / run) * 180) / Math.PI;
  const slopeLen = Math.sqrt(rise * rise + run * run);
  return { grade, angle, slopeLen, extra: slopeLen - run };
}

/** Grade from a clinometer / phone pitch. Angle is elevation from level. */
export function gradeFromPitch(pitchDeg: number) {
  const angle = Math.abs(pitchDeg);
  const a = (angle * Math.PI) / 180;
  return { grade: 100 * Math.tan(a), angle };
}

export function naismithHours(opts: {
  imperial: boolean;
  dist: number;
  climb: number;
  packLb: number;
  terrain: number;
}) {
  let hours = opts.imperial
    ? opts.dist / 3 + opts.climb / 2000
    : opts.dist / 5 + opts.climb / 600;
  const terr = Math.max(1, opts.terrain);
  hours *= 1 + 0.0055 * Math.max(opts.packLb, 0);
  hours *= terr;
  return hours;
}

export function formatHours(hours: number) {
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  if (m === 60) {
    h += 1;
    m = 0;
  }
  return `${h}h ${m}m`;
}

export function boilC(elevM: number) {
  return 100 - elevM / 300;
}

export function heatEnergyKJ(volL: number, dT: number, snow: boolean) {
  let q = volL * 4.184 * dT;
  if (snow) q += volL * 334;
  return q;
}

export function mpgFromFill(miles: number, gallons: number) {
  return miles / gallons;
}

export function lPer100(mpg: number) {
  return 235.215 / mpg;
}

/** Calibrate over 100 of the unit. One pace = same foot hits again. */
export function paceDistance(pacesWalked: number, pacesPerHundred: number) {
  return (pacesWalked / pacesPerHundred) * 100;
}

/** 12-ft bag rule: bag 12 ft up, 6 ft from trunk, 6 ft below the limb. */
export function hangGeometry(span: number, branch: number, imperial: boolean) {
  const spanFt = imperial ? span : span * 3.28084;
  const branchFt = imperial ? branch : branch * 3.28084;
  const tail = imperial ? 10 : 3;
  return {
    rope: span + 2 * branch + tail,
    ok: branchFt >= 18 && spanFt >= 12,
  };
}

export type WorkLevel = "light" | "medium" | "heavy";

const WALK_KCAL_PER_KG_KM: Record<WorkLevel, number> = {
  light: 0.55,
  medium: 0.75,
  heavy: 1.05,
};

const PAL: Record<WorkLevel, number> = {
  light: 1.4,
  medium: 1.55,
  heavy: 1.7,
};

/** Climb cost ~0.007 kcal/kg/m (backpacking band ~100–150 kcal / 1000 ft at 160 lb). */
const CLIMB_KCAL_PER_KG_M = 0.007;

/** Mifflin-St Jeor 1990. Mass kg, stature cm, age years. */
export function mifflinBmr(kg: number, cm: number, age: number, male: boolean) {
  return 10 * kg + 6.25 * cm - 5 * age + (male ? 5 : -161);
}

/** Extra fraction of BMR for cold / humid heat. Neutral band ~60–75°F. */
export function weatherKcalFactor(tF: number, rh: number) {
  const r = Math.max(0, Math.min(100, rh));
  let extra = 0;
  if (tF < 60) extra += 0.03 * ((60 - tF) / 10);
  if (tF >= 75) {
    const hi = tF >= 80 ? heatIndexF(tF, r) : tF;
    extra += 0.04 * (Math.max(0, hi - 75) / 10) * (0.75 + 0.5 * (r / 100));
  }
  return Math.min(0.35, Math.max(0, extra));
}

export function calorieNeed(opts: {
  kg: number;
  cm: number;
  age: number;
  male: boolean;
  work: WorkLevel;
  tF: number;
  rh: number;
  distKm: number;
  gainM: number;
}) {
  const kg = Math.max(30, opts.kg);
  const bmr = Math.max(800, mifflinBmr(kg, opts.cm, opts.age, opts.male));
  const dist = Math.max(0, opts.distKm);
  const gain = Math.max(0, opts.gainM);
  const walk = kg * dist * WALK_KCAL_PER_KG_KM[opts.work] + kg * gain * CLIMB_KCAL_PER_KG_M;
  const weather = bmr * weatherKcalFactor(opts.tF, opts.rh);
  const camp = bmr * PAL[opts.work];
  return {
    bmr: Math.round(bmr),
    camp: Math.round(camp),
    walk: Math.round(walk),
    weather: Math.round(weather),
    total: Math.round(camp + walk + weather),
  };
}

export type LngLat = { lat: number; lon: number };

export function wrapDeg(d: number) {
  const x = d % 360;
  return x < 0 ? x + 360 : x;
}

function rad(d: number) {
  return (d * Math.PI) / 180;
}
function deg(r: number) {
  return (r * 180) / Math.PI;
}

function metersPerDeg(lat0: number) {
  const φ = rad(lat0);
  return {
    lat: 111132.92 - 559.82 * Math.cos(2 * φ) + 1.175 * Math.cos(4 * φ),
    lon: 111412.84 * Math.cos(φ) - 93.5 * Math.cos(3 * φ),
  };
}

export function toEnu(p: LngLat, origin: LngLat) {
  const m = metersPerDeg(origin.lat);
  return { e: (p.lon - origin.lon) * m.lon, n: (p.lat - origin.lat) * m.lat };
}

export function fromEnu(e: number, n: number, origin: LngLat): LngLat {
  const m = metersPerDeg(origin.lat);
  return { lat: origin.lat + n / m.lat, lon: origin.lon + e / m.lon };
}

/** True heading from `from` to `to`, degrees 0–360. Local tangent, not a great-circle. */
export function bearingEnu(from: LngLat, to: LngLat) {
  const origin = { lat: (from.lat + to.lat) / 2, lon: (from.lon + to.lon) / 2 };
  const a = toEnu(from, origin);
  const b = toEnu(to, origin);
  return wrapDeg(deg(Math.atan2(b.e - a.e, b.n - a.n)));
}

export function haversineM(a: LngLat, b: LngLat) {
  const R = 6371000;
  const dφ = rad(b.lat - a.lat);
  const dλ = rad(b.lon - a.lon);
  const s =
    Math.sin(dφ / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function riseRunM(
  a: LngLat & { altM?: number | null },
  b: LngLat & { altM?: number | null },
) {
  return {
    runM: haversineM(a, b),
    riseM: a.altM != null && b.altM != null ? b.altM - a.altM : null,
  };
}

export function formatLatLon(p: LngLat) {
  const ns = p.lat >= 0 ? "N" : "S";
  const ew = p.lon >= 0 ? "E" : "W";
  const alat = Math.abs(p.lat);
  const alon = Math.abs(p.lon);
  const ddm = (x: number) => {
    const d = Math.floor(x);
    const m = (x - d) * 60;
    return `${d}° ${m.toFixed(3)}'`;
  };
  return {
    decimal: `${alat.toFixed(5)}° ${ns}  ${alon.toFixed(5)}° ${ew}`,
    ddm: `${ddm(alat)} ${ns}  ${ddm(alon)} ${ew}`,
  };
}

export type ResectResult =
  | {
      ok: true;
      fix: LngLat;
      cutDeg: number;
      distAM: number;
      distBM: number;
      note: string;
      tone: "ok" | "warn" | "danger";
    }
  | { ok: false; note: string; tone: "warn" | "danger" };

/**
 * Two-point compass resection.
 * `brgA` / `brgB` are TRUE headings you shot TO landmarks A and B.
 * Reverse rays from those points cut at you.
 */
export function resectTwo(a: LngLat, b: LngLat, brgA: number, brgB: number): ResectResult {
  const same = Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lon - b.lon) < 1e-7;
  if (same) return { ok: false, note: "Pick two different landmarks.", tone: "warn" };

  const origin = { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 };
  const A = toEnu(a, origin);
  const B = toEnu(b, origin);
  const thA = rad(brgA);
  const thB = rad(brgB);
  const sinA = Math.sin(thA);
  const cosA = Math.cos(thA);
  const sinB = Math.sin(thB);
  const cosB = Math.cos(thB);
  const dE = B.e - A.e;
  const dN = B.n - A.n;
  const det = -sinA * cosB + sinB * cosA;
  if (Math.abs(det) < 1e-3) {
    return { ok: false, note: "Headings nearly parallel. No cut. Pick a wider pair.", tone: "danger" };
  }
  const t = (dE * cosB - sinB * dN) / det;
  const s = (-sinA * dN + cosA * dE) / det;
  if (t <= 0 || s <= 0) {
    return {
      ok: false,
      note: "Those headings do not meet behind both landmarks. You would not see both from that cut. Check the shots.",
      tone: "danger",
    };
  }
  if (t > 80000 || s > 80000) {
    return {
      ok: false,
      note: "Cut is tens of miles out. You would not see those marks from there. Check the shots.",
      tone: "danger",
    };
  }
  const fixEnu = { e: A.e - t * sinA, n: A.n - t * cosA };
  const fix = fromEnu(fixEnu.e, fixEnu.n, origin);
  let cut = Math.abs(wrapDeg(brgA) - wrapDeg(brgB));
  if (cut > 180) cut = 360 - cut;
  const thin = cut < 25 || cut > 155;
  const note = thin
    ? `Thin cut (${cut.toFixed(0)}°). A few degrees of compass error moves you a long way. Walk, or pick a pair closer to 90°.`
    : `Cut ${cut.toFixed(0)}°. Treat it as a patch, not a pin.`;
  return {
    ok: true,
    fix,
    cutDeg: cut,
    distAM: t,
    distBM: s,
    note,
    tone: thin ? "warn" : "ok",
  };
}

