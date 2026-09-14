import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type FieldReading = {
  pressureHpa?: number | null;
  tempC?: number | null;
  ax?: number | null;
  ay?: number | null;
  az?: number | null;
};

export type FieldStart = {
  ok: boolean;
  hasBaro: boolean;
  hasTemp: boolean;
  hasGravity: boolean;
};

export interface FieldSensorsPlugin {
  start(): Promise<FieldStart>;
  stop(): Promise<void>;
  addListener(
    eventName: "reading",
    listenerFunc: (r: FieldReading) => void,
  ): Promise<PluginListenerHandle>;
}

export const FieldSensors = registerPlugin<FieldSensorsPlugin>("FieldSensors", {
  web: {
    async start() {
      return { ok: false, hasBaro: false, hasTemp: false, hasGravity: false };
    },
    async stop() {},
    async addListener() {
      return { remove: async () => {} };
    },
  },
});
