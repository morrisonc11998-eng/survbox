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
import { haversineM, wrapDeg } from "@/lib/survbox/math";

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
  speedMps: number | null;
  at: number;
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

function usePhoneSensorsState() {
  const [armed, setArmed] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fix, setFix] = useState<PhoneFix | null>(null);
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
  const fixRef = useRef<PhoneFix | null>(null);
  const lastTrack = useRef<{ lat: number; lon: number; altM: number | null } | null>(null);
  const tracking = useRef(false);
  const wakeRef = useRef<{ release: () => void } | null>(null);
  const watchRef = useRef<number | null>(null);
  const baroRef = useRef<Baro | null>(null);

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

    const Baro = (
      window as unknown as { BarometerSensor?: new (o?: { frequency?: number }) => Baro }
    ).BarometerSensor;
    if (Baro && !baroRef.current) {
      try {
        const sensor = new Baro({ frequency: 1 });
        const onRead = () => {
          const hpa = toHpa(sensor.pressure);
          pressureRef.current = hpa;
          baroAltRef.current = pressureAltM(hpa);
        };
        sensor.addEventListener("reading", onRead);
        sensor.start();
        baroRef.current = sensor;
      } catch {
        /* no baro permission / hardware */
      }
    }

    setArmed(true);
    if (!navigator.geolocation) {
      setMsg("No GPS on this device. Type the numbers.");
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
  }, [publish]);

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
      if (e.beta != null && Number.isFinite(e.beta)) {
        let elev = 90 - e.beta;
        if (elev > 90) elev -= 180;
        if (elev < -90) elev += 180;
        pitchRef.current = elev;
      }
      setFix((f) => {
        if (!f) return f;
        const next: PhoneFix = {
          ...f,
          heading: headingRef.current,
          pitchDeg: pitchRef.current,
          pressureHpa: pressureRef.current,
          altM: baroAltRef.current ?? f.altM,
          altSource: baroAltRef.current != null ? "baro" : f.altSource,
        };
        fixRef.current = next;
        return next;
      });
    };
    window.addEventListener("deviceorientationabsolute", onOri as EventListener);
    window.addEventListener("deviceorientation", onOri as EventListener);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOri as EventListener);
      window.removeEventListener("deviceorientation", onOri as EventListener);
    };
  }, [armed]);

  useEffect(() => {
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      try {
        baroRef.current?.stop();
      } catch {
        /* ignore */
      }
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

  return {
    armed,
    msg,
    fix,
    track,
    headingRef,
    pitchRef,
    fixRef,
    arm,
    afterArm,
    startTrack,
    stopTrack,
    resetTrack,
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
  track: { running: false, distM: 0, climbM: 0, points: 0 },
  headingRef: stubRef,
  pitchRef: stubRef,
  fixRef: stubRef,
  arm: async () => {},
  afterArm: async () => null,
  startTrack: async () => {},
  stopTrack: () => {},
  resetTrack: () => {},
};
