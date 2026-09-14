import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { Field, NumInput, Panel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { How, Result } from "@/components/result";
import { SensorDock } from "@/components/sensor-dock";
import { useUnits } from "@/lib/survbox/units";
import {
  fmtMeters,
  usePhoneSensors,
} from "@/lib/survbox/sensors";
import {
  bearingEnu,
  formatLatLon,
  haversineM,
  wrapDeg,
} from "@/lib/survbox/math";
import {
  loadWaypoints,
  saveWaypoints,
  newId,
  type Waypoint,
} from "@/lib/survbox/persist";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

function token(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function ToolGpsMap() {
  const { system } = useUnits();
  const imperial = system === "us";
  const s = usePhoneSensors();
  const [wpts, setWpts] = useState<Waypoint[]>(() => loadWaypoints());
  const [name, setName] = useState("");
  const [navId, setNavId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  function persist(next: Waypoint[]) {
    setWpts(next);
    saveWaypoints(next);
  }

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
      }).setView([39.42, -81.45], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      layersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
    })();
    return () => {
      dead = true;
      map?.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !layersRef.current) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !layersRef.current) return;
      const layer = layersRef.current;
      layer.clearLayers();
      const accent = token("--color-accent", "#c5cbb8");
      const warn = token("--color-warn", "#c4a574");
      if (s.fix) {
        L.circleMarker([s.fix.lat, s.fix.lon], {
          radius: 7,
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
      }
      for (const w of wpts) {
        const active = w.id === navId;
        L.circleMarker([w.lat, w.lon], {
          radius: active ? 8 : 6,
          color: active ? warn : accent,
          weight: 2,
          fillOpacity: 0.85,
        })
          .bindTooltip(w.name, { permanent: false })
          .addTo(layer);
      }
      if (s.fix && navId) {
        const w = wpts.find((x) => x.id === navId);
        if (w) {
          L.polyline(
            [
              [s.fix.lat, s.fix.lon],
              [w.lat, w.lon],
            ],
            { color: warn, weight: 2, dashArray: "6 6" },
          ).addTo(layer);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [s.fix, wpts, navId, mapReady]);

  async function saveHere() {
    const f = await s.afterArm(() => s.fixRef.current);
    if (!f) return;
    const label = name.trim() || `WP ${wpts.length + 1}`;
    persist([
      {
        id: newId("wp"),
        name: label,
        lat: f.lat,
        lon: f.lon,
        altM: f.altM,
        at: Date.now(),
      },
      ...wpts,
    ]);
    setName("");
  }

  function centerGps() {
    void s.afterArm(() => s.fixRef.current).then((f) => {
      if (f) mapRef.current?.setView([f.lat, f.lon], 15);
    });
  }

  const nav = useMemo(() => {
    const w = wpts.find((x) => x.id === navId);
    if (!w || !s.fix) return null;
    const distM = haversineM(s.fix, w);
    const brg = bearingEnu(s.fix, w);
    const hdg = s.fix.heading;
    const rel = hdg != null ? wrapDeg(brg - hdg) : null;
    let turn = "Shoot a heading.";
    if (rel != null) {
      const signed = rel > 180 ? rel - 360 : rel;
      if (Math.abs(signed) < 8) turn = "On bearing.";
      else if (signed > 0) turn = `Right ${Math.abs(signed).toFixed(0)}°`;
      else turn = `Left ${Math.abs(signed).toFixed(0)}°`;
    }
    return { w, distM, brg, rel, turn, fmt: formatLatLon(w) };
  }, [wpts, navId, s.fix]);

  return (
    <div className="grid gap-4">
      <How>
        Drop a named mark where you stand. Navigate walks the bearing and the
        range back to it. Map tiles need a network. The list does not. Reset
        wipes the list on this phone.
      </How>
      <SensorDock s={s} imperial={imperial}>
        <div className="grid gap-2">
          <Field label="Waypoint name">
            <NumInput
              inputMode="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ridge, truck, camp"
            />
          </Field>
          <Button className="w-full" onClick={() => void saveHere()}>
            Save GPS here
          </Button>
        </div>
      </SensorDock>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center justify-between gap-2 bg-raised px-3 py-2">
          <p className="font-display text-xs font-semibold tracking-[0.18em] text-muted uppercase">
            Map
          </p>
          <button type="button" className="min-h-11 px-2 text-xs text-muted" onClick={centerGps}>
            Center GPS
          </button>
        </div>
        <div ref={mapEl} className="h-72 w-full" />
      </div>

      {nav ? (
        <Result
          items={[
            { k: "To", v: nav.w.name },
            { k: "Range", v: fmtMeters(nav.distM, imperial) },
            { k: "Bearing", v: `${nav.brg.toFixed(0)}°` },
            { k: "Mark", v: nav.fmt.ddm },
          ]}
          note={nav.turn}
          tone={nav.distM < 25 ? "ok" : "warn"}
        />
      ) : null}

      {nav && nav.rel != null ? (
        <div className="flex justify-center">
          <div className="relative size-36 rounded-full border border-border bg-raised">
            <div
              className="absolute top-2 left-1/2 h-12 w-0.5 origin-bottom bg-accent"
              style={{ transform: `translateX(-50%) rotate(${nav.rel}deg)` }}
            />
            <p className="absolute inset-0 flex items-center justify-center font-mono text-xs text-muted">
              {nav.rel > 180 ? (nav.rel - 360).toFixed(0) : nav.rel.toFixed(0)}°
            </p>
          </div>
        </div>
      ) : null}

      <Panel className="grid gap-2">
        <p className="font-display text-xs font-semibold tracking-[0.18em] text-muted uppercase">
          Waypoints
        </p>
        {wpts.length === 0 ? (
          <p className="text-sm text-muted">None saved on this phone.</p>
        ) : (
          <ul className="grid gap-2">
            {wpts.map((w) => (
              <li
                key={w.id}
                className={cn(
                  "grid gap-2 rounded-lg border border-border bg-bg p-3",
                  navId === w.id && "border-accent",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{w.name}</p>
                    <p className="font-mono text-xs text-muted">{formatLatLon(w).ddm}</p>
                    {s.fix ? (
                      <p className="text-xs text-subtle">
                        {fmtMeters(haversineM(s.fix, w), imperial)} · {bearingEnu(s.fix, w).toFixed(0)}°
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={navId === w.id ? "primary" : "secondary"}
                    onClick={() => {
                      setNavId(w.id);
                      mapRef.current?.setView([w.lat, w.lon], 15);
                    }}
                  >
                    Navigate
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      persist(wpts.filter((x) => x.id !== w.id));
                      if (navId === w.id) setNavId(null);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {wpts.length > 0 ? (
          confirmReset ? (
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                persist([]);
                setNavId(null);
                setConfirmReset(false);
              }}
            >
              Confirm reset all
            </Button>
          ) : (
            <Button variant="ghost" className="w-full" onClick={() => setConfirmReset(true)}>
              Reset waypoints
            </Button>
          )
        ) : null}
      </Panel>
      {s.fix && wpts.length > 0 ? (
        <p className="text-xs text-subtle">
          Treat GPS as {fmtMeters(s.fix.accM, imperial)} slop. Map tiles need a
          network. The marks stay on the phone.
        </p>
      ) : null}
    </div>
  );
}
