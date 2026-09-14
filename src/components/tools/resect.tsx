import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { Field, NumInput, Panel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Eq, How, Result } from "@/components/result";
import { SensorDock } from "@/components/sensor-dock";
import { useUnits } from "@/lib/survbox/units";
import { useNum } from "@/lib/survbox/num";
import { fmtMeters, usePhoneSensors } from "@/lib/survbox/sensors";
import {
  formatLatLon,
  fromEnu,
  haversineM,
  resectTwo,
  wrapDeg,
  type LngLat,
} from "@/lib/survbox/math";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

type Mark = LngLat & { label: "A" | "B" };

function token(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function reversePoint(from: LngLat, brgTrueToMark: number, meters: number): LngLat {
  const th = (brgTrueToMark * Math.PI) / 180;
  return fromEnu(-meters * Math.sin(th), -meters * Math.cos(th), from);
}

export function ToolResect() {
  const { system } = useUnits();
  const imperial = system === "us";
  const [placing, setPlacing] = useState<"A" | "B">("A");
  const [a, setA] = useState<Mark | null>(null);
  const [b, setB] = useState<Mark | null>(null);
  const hdgA = useNum("");
  const hdgB = useNum("");
  const decl = useNum("0");
  const [magnetic, setMagnetic] = useState(true);
  const s = usePhoneSensors();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LayerGroup | null>(null);
  const gpsLayerRef = useRef<LayerGroup | null>(null);
  const fittedKey = useRef("");
  const [mapReady, setMapReady] = useState(false);
  const stateRef = useRef({ placing, a, b });
  stateRef.current = { placing, a, b };

  const trueA = hdgA.ok ? wrapDeg(hdgA.n + (magnetic ? decl.n || 0 : 0)) : NaN;
  const trueB = hdgB.ok ? wrapDeg(hdgB.n + (magnetic ? decl.n || 0 : 0)) : NaN;

  const cut = useMemo(() => {
    if (!a || !b || !Number.isFinite(trueA) || !Number.isFinite(trueB)) return null;
    return resectTwo(a, b, trueA, trueB);
  }, [a, b, trueA, trueB]);

  useEffect(() => {
    const root = mapEl.current;
    if (!root) return;
    let dead = false;
    let map: LeafletMap | null = null;
    (async () => {
      const L = await import("leaflet");
      if (dead || !mapEl.current) return;
      map = L.map(mapEl.current, {
        zoomControl: false,
        attributionControl: true,
        fadeAnimation: false,
      }).setView([39.42, -81.45], 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      const layers = L.layerGroup().addTo(map);
      const gpsLayer = L.layerGroup().addTo(map);
      mapRef.current = map;
      layersRef.current = layers;
      gpsLayerRef.current = gpsLayer;
      setMapReady(true);
      map.on("click", (ev) => {
        const { placing: next, a: curA, b: curB } = stateRef.current;
        const p: Mark = { lat: ev.latlng.lat, lon: ev.latlng.lng, label: next };
        if (next === "A") {
          setA(p);
          if (!curB) setPlacing("B");
        } else {
          setB(p);
          if (!curA) setPlacing("A");
        }
      });
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (dead) return;
            map?.setView([pos.coords.latitude, pos.coords.longitude], 13);
          },
          () => undefined,
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 },
        );
      }
    })();
    return () => {
      dead = true;
      map?.remove();
      mapRef.current = null;
      layersRef.current = null;
      gpsLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !layersRef.current) return;
      layers.clearLayers();
      const accent = token("--color-accent", "#c5cbb8");
      const warn = token("--color-warn", "#c4a574");
      const fg = token("--color-fg", "#ece6d8");
      const danger = token("--color-danger", "#c45c4a");
      const pin = (m: Mark, active: boolean) =>
        L.divIcon({
          className: "survbox-pin",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          html: `<div class="survbox-pin-dot${active ? " is-active" : ""}">${m.label}</div>`,
        });
      if (a) {
        L.marker([a.lat, a.lon], { icon: pin(a, placing === "A"), draggable: true })
          .on("dragend", (e) => {
            const ll = (e.target as { getLatLng: () => { lat: number; lng: number } }).getLatLng();
            setA({ lat: ll.lat, lon: ll.lng, label: "A" });
          })
          .addTo(layers);
      }
      if (b) {
        L.marker([b.lat, b.lon], { icon: pin(b, placing === "B"), draggable: true })
          .on("dragend", (e) => {
            const ll = (e.target as { getLatLng: () => { lat: number; lng: number } }).getLatLng();
            setB({ lat: ll.lat, lon: ll.lng, label: "B" });
          })
          .addTo(layers);
      }
      if (a && Number.isFinite(trueA)) {
        const end = reversePoint(a, trueA, cut && cut.ok ? cut.distAM : 12000);
        L.polyline(
          [
            [a.lat, a.lon],
            [end.lat, end.lon],
          ],
          { color: accent, weight: 2, dashArray: "6 8", opacity: 0.9 },
        ).addTo(layers);
      }
      if (b && Number.isFinite(trueB)) {
        const end = reversePoint(b, trueB, cut && cut.ok ? cut.distBM : 12000);
        L.polyline(
          [
            [b.lat, b.lon],
            [end.lat, end.lon],
          ],
          { color: warn, weight: 2, dashArray: "6 8", opacity: 0.9 },
        ).addTo(layers);
      }
      if (cut && cut.ok && a && b) {
        L.circleMarker([cut.fix.lat, cut.fix.lon], {
          radius: 8,
          color: fg,
          weight: 2,
          fillColor: danger,
          fillOpacity: 1,
        }).addTo(layers);
        L.circleMarker([cut.fix.lat, cut.fix.lon], {
          radius: 16,
          color: danger,
          weight: 1,
          fillOpacity: 0,
        }).addTo(layers);
        const key = `${cut.fix.lat.toFixed(5)},${cut.fix.lon.toFixed(5)}`;
        if (fittedKey.current !== key) {
          fittedKey.current = key;
          map.fitBounds(
            [
              [a.lat, a.lon],
              [b.lat, b.lon],
              [cut.fix.lat, cut.fix.lon],
            ],
            { padding: [28, 28], maxZoom: 14, animate: false },
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [a, b, placing, trueA, trueB, cut]);

  useEffect(() => {
    const layer = gpsLayerRef.current;
    if (!layer) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !gpsLayerRef.current) return;
      layer.clearLayers();
      if (!s.fix) return;
      const accent = token("--color-accent", "#c5cbb8");
      L.circleMarker([s.fix.lat, s.fix.lon], {
        radius: 6,
        color: accent,
        weight: 2,
        fillColor: accent,
        fillOpacity: 0.9,
      }).addTo(layer);
      L.circle([s.fix.lat, s.fix.lon], {
        radius: Math.max(8, s.fix.accM),
        color: accent,
        weight: 1,
        fillOpacity: 0.08,
      }).addTo(layer);
    })();
    return () => {
      cancelled = true;
    };
  }, [s.fix, mapReady]);

  async function shoot(which: "A" | "B") {
    const h = await s.afterArm(() => s.headingRef.current);
    if (h == null) return;
    const v = h.toFixed(0);
    if (which === "A") hdgA.setV(v);
    else hdgB.setV(v);
  }

  async function dropHere(which: "A" | "B") {
    const f = await s.afterArm(() => s.fixRef.current);
    if (!f) return;
    const p: Mark = { lat: f.lat, lon: f.lon, label: which };
    if (which === "A") setA(p);
    else setB(p);
  }

  function centerGps() {
    void s.afterArm(() => s.fixRef.current).then((f) => {
      if (f) mapRef.current?.setView([f.lat, f.lon], 14);
    });
  }

  const gpsDelta =
    cut && cut.ok && s.fix ? haversineM(s.fix, cut.fix) : null;
  const fmt = cut && cut.ok ? formatLatLon(cut.fix) : null;
  const spread = a && b ? haversineM(a, b) : null;

  return (
    <div className="grid gap-4">
      <How>
        You look at a named mark and shoot the heading TO it. From that mark the
        reverse line runs back through you. Two of those lines cut at your fix.
        Pick marks you can see, 30–150° apart. GPS is a check, not the answer.
        Map tiles need a network. The cut does not.
      </How>
      <Eq>you = reverse(A, heading→A) ∩ reverse(B, heading→B)</Eq>

      <SensorDock s={s} imperial={imperial}>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => void dropHere("A")}>
            I am at A
          </Button>
          <Button variant="secondary" onClick={() => void dropHere("B")}>
            I am at B
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-subtle">
          Walk to a named mark and drop it. Shoot headings from where you stand.
        </p>
      </SensorDock>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center justify-between gap-2 bg-raised px-3 py-2">
          <p className="font-display text-xs font-semibold tracking-[0.18em] text-muted uppercase">
            Tap {placing} on the map
          </p>
          <button type="button" className="min-h-11 px-2 text-xs text-muted" onClick={centerGps}>
            Center GPS
          </button>
        </div>
        <div ref={mapEl} className="h-80 w-full" />
        <div className="grid grid-cols-2 divide-x divide-border bg-surface">
          <button
            type="button"
            className={cn(
              "min-h-11 px-3 text-left text-sm",
              placing === "A" ? "bg-raised text-fg" : "text-muted",
            )}
            onClick={() => setPlacing("A")}
          >
            <span className="font-display font-semibold">A</span>
            <span className="ml-2 font-mono text-xs">
              {a ? `${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}` : "tap map"}
            </span>
          </button>
          <button
            type="button"
            className={cn(
              "min-h-11 px-3 text-left text-sm",
              placing === "B" ? "bg-raised text-fg" : "text-muted",
            )}
            onClick={() => setPlacing("B")}
          >
            <span className="font-display font-semibold">B</span>
            <span className="ml-2 font-mono text-xs">
              {b ? `${b.lat.toFixed(4)}, ${b.lon.toFixed(4)}` : "tap map"}
            </span>
          </button>
        </div>
      </div>

      <Panel className="grid gap-3">
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
          <Field label="Heading to A (deg)">
            <NumInput
              value={hdgA.v}
              onChange={(e) => hdgA.setV(e.target.value)}
              placeholder="0–360"
            />
          </Field>
          <Button variant="secondary" className="px-3" onClick={() => void shoot("A")}>
            Shoot A
          </Button>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
          <Field label="Heading to B (deg)">
            <NumInput
              value={hdgB.v}
              onChange={(e) => hdgB.setV(e.target.value)}
              placeholder="0–360"
            />
          </Field>
          <Button variant="secondary" className="px-3" onClick={() => void shoot("B")}>
            Shoot B
          </Button>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5 accent-accent"
            checked={magnetic}
            onChange={(e) => setMagnetic(e.target.checked)}
          />
          Compass is magnetic
        </label>
        {magnetic ? (
          <Field label="Declination °E (west is negative)">
            <NumInput value={decl.v} onChange={(e) => decl.setV(e.target.value)} placeholder="0" />
          </Field>
        ) : null}
        <p className="text-xs leading-relaxed text-subtle">
          Phone and lensatic compasses are magnetic. Map north is true. East of
          true is positive. A lot of the Ohio valley sits near −8°. Leave 0 if
          you shot true on the map.
        </p>
      </Panel>

      {cut && !cut.ok ? (
        <Result items={[{ k: "Fix", v: "none" }]} note={cut.note} tone={cut.tone} />
      ) : null}

      {cut && cut.ok && fmt ? (
        <Result
          items={[
            { k: "Fix (DDM)", v: fmt.ddm },
            { k: "Decimal", v: fmt.decimal },
            { k: "Cut", v: `${cut.cutDeg.toFixed(0)}°` },
            { k: "Range A", v: fmtMeters(cut.distAM, imperial) },
            { k: "Range B", v: fmtMeters(cut.distBM, imperial) },
            ...(spread != null ? [{ k: "A to B", v: fmtMeters(spread, imperial) }] : []),
            ...(gpsDelta != null
              ? [{ k: "GPS vs cut", v: fmtMeters(gpsDelta, imperial) }]
              : []),
          ]}
          note={
            gpsDelta != null
              ? `${cut.note} GPS is ${fmtMeters(gpsDelta, imperial)} from the cut. Trust the tighter of the two.`
              : cut.note
          }
          tone={cut.tone}
        />
      ) : null}
    </div>
  );
}
