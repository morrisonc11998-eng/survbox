import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { haversineM, pitchFromGravity, wrapDeg } from "@/lib/survbox/math";
import { FieldSensors } from "@/lib/survbox/field-sensors";

export type PhoneFix = {
  lat: number;
  lon: number;
  accM: number;
  altM: number | null;
  altSource: "baro" | "gps" | null;
  heading: number | null;
  courseDeg: number | null;
  pitchDeg: number | null;
  pressureHpa: number | null;
  tempC: number | null;
  speedMps: number | null;
  at: number;
};

export type LiveSensors = {
  pitchDeg: number | null;
  heading: number | null;
  pressureHpa: number | null;
  tempC: number | null;
  baroAltM: number | null;
};

const EMPTY_LIVE: LiveSensors = {
  pitchDeg: null,
  heading: null,
  pressureHpa: null,
  tempC: null,
  baroAltM: null,
};

export type PhoneTrack = {
  running: boolean;
  distM: number;
  climbM: number;
  points: number;
};

type Baro = {
  start: () => void;
  stop: () => void;
  addEventListener: (type: "reading", fn: () => void) => void;
  removeEventListener: (type: "reading", fn: () => void) => void;
  pressure: number;
};

type Ambient = {
  start: () => void;
  stop: () => void;
  addEventListener: (type: "reading", fn: () => void) => void;
  removeEventListener: (type: "reading", fn: () => void) => void;
  temperature: number;
};

function pressureAltM(hpa: number) {
  const p = Math.max(300, Math.min(1100, hpa));
  return 44330.77 * (1 - (p / 1013.25) ** 0.190266);
}

function toHpa(raw: number) {
  return raw < 200 ? raw * 10 : raw;
}

export function fmtMeters(m: number, imperial: boolean) {
  if (imperial) {
    const ft = m * 3.28084;
    if (Math.abs(ft) >= 1000) return `${(ft / 5280).toFixed(2)} mi`;
    return `${ft.toFixed(0)} ft`;
  }
  if (Math.abs(m) >= 800) return `${(m / 1000).toFixed(2)} km`;
  return `${m.toFixed(0)} m`;
}

export function fmtSpeed(mps: number, imperial: boolean) {
  if (imperial) return `${(mps * 2.23694).toFixed(1)} mph`;
  return `${(mps * 3.6).toFixed(1)} km/h`;
}

export function mToLen(m: number, imperial: boolean) {
  return imperial ? m * 3.28084 : m;
}

export function mToTravel(m: number, imperial: boolean) {
  return imperial ? m / 1609.34 : m / 1000;
}

export function fmtTemp(c: number, imperial: boolean) {
  return imperial ? `${((c * 9) / 5 + 32).toFixed(1)}°F` : `${c.toFixed(1)}°C`;
}

function applyPitch(ax: number, ay: number, az: number, pitchRef: { current: number | null }) {
  const p = pitchFromGravity(ax, ay, az);
  if (p != null) pitchRef.current = p;
}

function usePhoneSensorsState() {
  const [armed, setArmed] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fix, setFix] = useState<PhoneFix | null>(null);
  const [live, setLive] = useState<LiveSensors>(EMPTY_LIVE);
  const [track, setTrack] = useState<PhoneTrack>({
    running: false,
    distM: 0,
    climbM: 0,
    points: 0,
  });
  const headingRef = useRef<number | null>(null);
  const pitchRef = useRef<number | null>(null);
  const baroAltRef = useRef<number | null>(null);
  const pressureRef = useRef<number | null>(null);
  const pressureAtRef = useRef<number | null>(null);
  const pressurePrevRef = useRef<{ hpa: number; at: number } | null>(null);
  const tempRef = useRef<number | null>(null);
  const fixRef = useRef<PhoneFix | null>(null);
  const lastTrack = useRef<{ lat: number; lon: number; altM: number | null } | null>(null);
  const tracking = useRef(false);
  const wakeRef = useRef<{ release: () => void } | null>(null);
  const watchRef = useRef<number | null>(null);
  const baroRef = useRef<Baro | null>(null);
  const tempSensorRef = useRef<Ambient | null>(null);
  const nativeStop = useRef<(() => void) | null>(null);
  const nativeHasG = useRef(false);
  const lastPaint = useRef(0);

  const stampPressure = useCallback((hpa: number) => {
    pressureRef.current = hpa;
    baroAltRef.current = pressureAltM(hpa);
    const now = Date.now();
    if (pressureAtRef.current == null) {
      pressurePrevRef.current = { hpa, at: now };
    } else if (now - (pressurePrevRef.current?.at ?? 0) > 90_000) {
      pressurePrevRef.current = { hpa: pressureRef.current ?? hpa, at: pressureAtRef.current };
    }
    pressureAtRef.current = now;
  }, []);

  const publish = useCallback(
    (
      partial: Partial<PhoneFix> &
        Pick<PhoneFix, "lat" | "lon" | "accM" | "at"> & { altGps?: number | null },
    ) => {
      const altB = baroAltRef.current;
      const next: PhoneFix = {
        lat: partial.lat,
        lon: partial.lon,
        accM: partial.accM,
        altM: altB ?? partial.altGps ?? partial.altM ?? null,
        altSource: altB != null ? "baro" : partial.altGps != null || partial.altM != null ? "gps" : null,
        heading: headingRef.current,
        courseDeg: partial.courseDeg ?? null,
        pitchDeg: pitchRef.current,
        pressureHpa: pressureRef.current,
        tempC: tempRef.current,
        speedMps: partial.speedMps ?? null,
        at: partial.at,
      };
      setFix(next);
      fixRef.current = next;
      if (!tracking.current) return;
      const prev = lastTrack.current;
      const step = prev ? haversineM(prev, next) : 0;
      if (prev && (step < 3 || next.accM > 45)) return;
      let dClimb = 0;
      if (prev?.altM != null && next.altM != null) {
        const dh = next.altM - prev.altM;
        if (dh > 1.5) dClimb = dh;
      }
      lastTrack.current = { lat: next.lat, lon: next.lon, altM: next.altM };
      setTrack((t) => ({
        running: true,
        distM: t.distM + (prev ? step : 0),
        climbM: t.climbM + dClimb,
        points: t.points + 1,
      }));
    },
    [],
  );

  const paintSensors = useCallback(() => {
    const now = Date.now();
    if (now - lastPaint.current < 80) return;
    lastPaint.current = now;
    setLive({
      pitchDeg: pitchRef.current,
      heading: headingRef.current,
      pressureHpa: pressureRef.current,
      tempC: tempRef.current,
      baroAltM: baroAltRef.current,
    });
    setFix((f) => {
      if (!f) return f;
      const next: PhoneFix = {
        ...f,
        heading: headingRef.current,
        pitchDeg: pitchRef.current,
        pressureHpa: pressureRef.current,
        tempC: tempRef.current,
        altM: baroAltRef.current ?? f.altM,
        altSource: baroAltRef.current != null ? "baro" : f.altSource,
      };
      fixRef.current = next;
      return next;
    });
  }, []);

  const arm = useCallback(async () => {
    if (typeof window === "undefined") return;
    setMsg(null);

    const DOE = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
      | undefined;
    try {
      if (DOE && typeof DOE.requestPermission === "function") {
        const p = await DOE.requestPermission();
        if (p !== "granted") setMsg("Compass blocked. Type headings.");
      }
    } catch {
      setMsg("Compass blocked. Type headings.");
    }
    const DME = window.DeviceMotionEvent as
      | (typeof DeviceMotionEvent & { requestPermission?: () => Promise<string> })
      | undefined;
    try {
      if (DME && typeof DME.requestPermission === "function") {
        await DME.requestPermission();
      }
    } catch {
      /* web pitch still tries */
    }

    if (Capacitor.isNativePlatform() && !nativeStop.current) {
      try {
        await FieldSensors.start();
        const handle = await FieldSensors.addListener("reading", (r) => {
          if (typeof r.pressureHpa === "number") stampPressure(r.pressureHpa);
          if (typeof r.tempC === "number") tempRef.current = r.tempC;
          if (typeof r.ax === "number" && typeof r.ay === "number" && typeof r.az === "number") {
            nativeHasG.current = true;
            applyPitch(r.ax, r.ay, r.az, pitchRef);
          }
          paintSensors();
        });
        nativeStop.current = () => {
          void handle.remove();
          void FieldSensors.stop();
        };
      } catch {
        nativeStop.current = null;
      }
    }

    const w = window as unknown as {
      BarometerSensor?: new (o?: { frequency?: number }) => Baro;
      AmbientTemperatureSensor?: new (o?: { frequency?: number }) => Ambient;
    };
    if (w.BarometerSensor && !baroRef.current && pressureRef.current == null) {
      try {
        const sensor = new w.BarometerSensor({ frequency: 1 });
        const onRead = () => stampPressure(toHpa(sensor.pressure));
        sensor.addEventListener("reading", onRead);
        sensor.start();
        baroRef.current = sensor;
      } catch {
        /* no baro */
      }
    }
    if (w.AmbientTemperatureSensor && !tempSensorRef.current && tempRef.current == null) {
      try {
        const sensor = new w.AmbientTemperatureSensor({ frequency: 0.5 });
        const onRead = () => {
          tempRef.current = sensor.temperature;
        };
        sensor.addEventListener("reading", onRead);
        sensor.start();
        tempSensorRef.current = sensor;
      } catch {
        /* no thermometer — most phones don't ship one */
      }
    }

    setArmed(true);
    if (!navigator.geolocation) {
      setMsg((m) => m ?? "No GPS on this device. Type the numbers.");
      paintSensors();
      return;
    }
    if (watchRef.current != null) return;
    const opts: PositionOptions = { enableHighAccuracy: true, maximumAge: 2000, timeout: 12000 };
    const onPos = (pos: GeolocationPosition) => {
      const speed = pos.coords.speed != null && Number.isFinite(pos.coords.speed) ? pos.coords.speed : null;
      const course =
        pos.coords.heading != null && Number.isFinite(pos.coords.heading) && (speed ?? 0) > 0.3
          ? wrapDeg(pos.coords.heading)
          : null;
      const altGps = Number.isFinite(pos.coords.altitude as number) ? (pos.coords.altitude as number) : null;
      publish({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accM: pos.coords.accuracy || 99,
        altGps,
        speedMps: speed,
        courseDeg: course,
        at: pos.timestamp,
      });
    };
    const onErr = (err: GeolocationPositionError) => {
      setMsg(err.code === 1 ? "GPS blocked. Type the numbers." : "No GPS fix yet.");
    };
    navigator.geolocation.getCurrentPosition(onPos, onErr, opts);
    watchRef.current = navigator.geolocation.watchPosition(onPos, onErr, opts);
  }, [paintSensors, publish, stampPressure]);

  useEffect(() => {
    if (!armed) return;
    const onOri = (e: DeviceOrientationEvent) => {
      const webkit = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading;
      if (typeof webkit === "number" && Number.isFinite(webkit)) {
        headingRef.current = wrapDeg(webkit);
      } else if (e.alpha != null) {
        headingRef.current = wrapDeg(360 - e.alpha);
      }
      paintSensors();
    };
    const onMotion = (e: DeviceMotionEvent) => {
      if (nativeHasG.current) return;
      const g = e.accelerationIncludingGravity;
      if (!g || g.x == null || g.y == null || g.z == null) return;
      applyPitch(g.x, g.y, g.z, pitchRef);
      paintSensors();
    };
    window.addEventListener("deviceorientationabsolute", onOri as EventListener);
    window.addEventListener("deviceorientation", onOri as EventListener);
    window.addEventListener("devicemotion", onMotion);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOri as EventListener);
      window.removeEventListener("deviceorientation", onOri as EventListener);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [armed, paintSensors]);

  useEffect(() => {
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      try {
        baroRef.current?.stop();
      } catch {
        /* ignore */
      }
      try {
        tempSensorRef.current?.stop();
      } catch {
        /* ignore */
      }
      nativeStop.current?.();
      void wakeRef.current?.release();
    };
  }, []);

  const startTrack = useCallback(async () => {
    tracking.current = true;
    lastTrack.current = null;
    setTrack({ running: true, distM: 0, climbM: 0, points: 0 });
    try {
      const anyNav = navigator as Navigator & {
        wakeLock?: { request: (t: "screen") => Promise<{ release: () => void }> };
      };
      wakeRef.current = (await anyNav.wakeLock?.request("screen")) ?? null;
    } catch {
      wakeRef.current = null;
    }
    if (!armed) await arm();
  }, [arm, armed]);

  const stopTrack = useCallback(() => {
    tracking.current = false;
    setTrack((t) => ({ ...t, running: false }));
    void wakeRef.current?.release();
    wakeRef.current = null;
  }, []);

  const resetTrack = useCallback(() => {
    tracking.current = false;
    lastTrack.current = null;
    setTrack({ running: false, distM: 0, climbM: 0, points: 0 });
    void wakeRef.current?.release();
    wakeRef.current = null;
  }, []);

  const afterArm = useCallback(
    async <T,>(read: () => T | null | undefined, ms = 1400): Promise<T | null> => {
      const hit = () => {
        const v = read();
        return v == null ? null : v;
      };
      const first = hit();
      if (first != null) return first;
      await arm();
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        await new Promise((r) => setTimeout(r, 120));
        const v = hit();
        if (v != null) return v;
      }
      return hit();
    },
    [arm],
  );

  const pressureTrend = useCallback((): -1 | 0 | 1 | null => {
    const now = pressureRef.current;
    const prev = pressurePrevRef.current;
    if (now == null || prev == null) return null;
    const dh = now - prev.hpa;
    if (Math.abs(dh) < 0.4) return 0;
    return dh < 0 ? -1 : 1;
  }, []);

  return {
    armed,
    msg,
    fix,
    live,
    track,
    headingRef,
    pitchRef,
    fixRef,
    tempRef,
    pressureRef,
    baroAltRef,
    arm,
    afterArm,
    startTrack,
    stopTrack,
    resetTrack,
    pressureTrend,
  };
}

export type PhoneSensors = ReturnType<typeof usePhoneSensorsState>;

const PhoneSensorsContext = createContext<PhoneSensors | null>(null);

export function PhoneSensorsProvider({ children }: { children: ReactNode }) {
  const value = usePhoneSensorsState();
  return createElement(PhoneSensorsContext.Provider, { value }, children);
}

export function usePhoneSensors(): PhoneSensors {
  const ctx = useContext(PhoneSensorsContext);
  return ctx ?? STUB;
}

const stubRef = { current: null };
const STUB: PhoneSensors = {
  armed: false,
  msg: null,
  fix: null,
  live: EMPTY_LIVE,
  track: { running: false, distM: 0, climbM: 0, points: 0 },
  headingRef: stubRef,
  pitchRef: stubRef,
  fixRef: stubRef,
  tempRef: stubRef,
  pressureRef: stubRef,
  baroAltRef: stubRef,
  arm: async () => {},
  afterArm: async () => null,
  startTrack: async () => {},
  stopTrack: () => {},
  resetTrack: () => {},
  pressureTrend: () => null,
};
