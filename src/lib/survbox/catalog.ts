import {
  CloudLightning,
  Compass,
  Droplets,
  HeartPulse,
  Car,
  BookOpen,
  Anchor,
  Trees,
  type LucideIcon,
} from "lucide-react";

export type ModuleId =
  | "air"
  | "move"
  | "water"
  | "craft"
  | "haul"
  | "vehicle"
  | "med"
  | "doctrine";

export type ToolDef = {
  id: string;
  title: string;
  blurb: string;
};

export type ModuleDef = {
  id: ModuleId;
  title: string;
  blurb: string;
  icon: LucideIcon;
  tools: ToolDef[];
};

export const MODULES: ModuleDef[] = [
  {
    id: "air",
    title: "Air / Storm",
    blurb: "PoP, ceiling, heat, chill, lightning, crack-boom.",
    icon: CloudLightning,
    tools: [
      { id: "pop", title: "PoP guess", blurb: "Dewpoint depression heuristic." },
      { id: "cloud", title: "Cloud base", blurb: "Lifted condensation level." },
      { id: "heat", title: "Heat / wet bulb", blurb: "Stull + Rothfusz." },
      { id: "chill", title: "Wind chill", blurb: "NWS 2001 + frostbite band." },
      { id: "lightning", title: "Lightning timer", blurb: "Flash to bang." },
      { id: "shot", title: "Crack / boom", blurb: "Flash-boom is range. Crack is not." },
    ],
  },
  {
    id: "move",
    title: "Move / Nav",
    blurb: "Slope, hike, pace, calories, height, resection. Phone sensors.",
    icon: Compass,
    tools: [
      { id: "slope", title: "Slope / grade", blurb: "Rise over run. Two GPS marks." },
      { id: "hike", title: "Hike time", blurb: "Naismith. Fill from a GPS track." },
      { id: "cals", title: "Calorie need", blurb: "BMR, work, weather. Miles from GPS." },
      { id: "pace", title: "Pace distance", blurb: "Calibrate 100. GPS if you have it." },
      { id: "height", title: "Height / range", blurb: "Phone pitch or a clinometer." },
      { id: "resect", title: "Fix / bearings", blurb: "Two landmarks. Compass. GPS check." },
    ],
  },
  {
    id: "water",
    title: "Water / Fire",
    blurb: "Boil, water need, river look.",
    icon: Droplets,
    tools: [
      { id: "boil", title: "Boil / fuel", blurb: "Elevation, heat, snow melt." },
      { id: "need", title: "Water need", blurb: "Hours, heat, work." },
      { id: "river", title: "River look", blurb: "When in doubt, walk." },
    ],
  },
  {
    id: "craft",
    title: "Bushcraft",
    blurb: "Shelters, traps, knots, signals, fire, the woods.",
    icon: Trees,
    tools: [
      { id: "shelters", title: "Shelters", blurb: "Lean-to, debris hut, tarp." },
      { id: "traps", title: "Traps", blurb: "Figure-4 and a simple snare." },
      { id: "knots", title: "Knots", blurb: "Bowline, figure-8, clove, trucker." },
      { id: "craftsig", title: "Signals", blurb: "Three fires, smoke, night." },
      { id: "fieldcare", title: "Splint / TQ", blurb: "Makeshift splint. Backup tourniquet." },
      { id: "natural", title: "Natural resources", blurb: "Tinder, sphagnum, mud." },
      { id: "firecraft", title: "Fire craft", blurb: "Start it. Boil on it. Trash kettle." },
    ],
  },
  {
    id: "haul",
    title: "Haul / Shelter",
    blurb: "Mechanical advantage and hang geometry.",
    icon: Anchor,
    tools: [
      { id: "rope", title: "Haul / rope", blurb: "Mechanical advantage vs load." },
      { id: "hang", title: "Hang / line", blurb: "12 / 6 / 6 bag rule." },
    ],
  },
  {
    id: "vehicle",
    title: "Vehicle",
    blurb: "12V battery and fuel burn.",
    icon: Car,
    tools: [
      { id: "battery", title: "12V battery", blurb: "Rest, crank, run." },
      { id: "fuel", title: "Fuel / range", blurb: "MPG, gallons, hours." },
    ],
  },
  {
    id: "med",
    title: "Medicine / TCCC",
    blurb: "AVPU, GCS, MARCH, vitals.",
    icon: HeartPulse,
    tools: [
      { id: "avpu", title: "AVPU", blurb: "Alert, Voice, Pain, Unresponsive." },
      { id: "gcs", title: "Glasgow Coma Scale", blurb: "E + V + M." },
      { id: "pulse", title: "Pulse timer", blurb: "Count beats on the clock." },
      { id: "resp", title: "Resp timer", blurb: "Watch the chest. Do not announce it." },
      { id: "march", title: "MARCH card", blurb: "Bleed, airway, breathe, circulate, cold." },
      { id: "shock", title: "Shock card", blurb: "What you see in the dirt." },
      { id: "burns", title: "Burns / nines", blurb: "Adult BSA." },
      { id: "mist", title: "MIST handoff", blurb: "Say it twice." },
      { id: "vitals", title: "Vitals card", blurb: "Adult bands. Trend is the story." },
    ],
  },
  {
    id: "doctrine",
    title: "Doctrine",
    blurb: "STOP, priorities, signal, lost, equations.",
    icon: BookOpen,
    tools: [
      { id: "exposure", title: "Exposure check", blurb: "Cold score from real inputs." },
      { id: "stop", title: "STOP", blurb: "Sit. Think. Observe. Plan." },
      { id: "priorities", title: "Priorities", blurb: "Bleed before food." },
      { id: "signal", title: "Signal", blurb: "Three of anything." },
      { id: "lost", title: "Lost", blurb: "Do not make a new last-known." },
      { id: "eqns", title: "Equations", blurb: "What the math actually is." },
    ],
  },
];

export function getModule(id: string) {
  return MODULES.find((m) => m.id === id);
}

export function getTool(moduleId: string, toolId: string) {
  const mod = getModule(moduleId);
  return mod?.tools.find((t) => t.id === toolId);
}
