import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cforged.survbox",
  appName: "SURVBOX",
  webDir: "android-www",
  backgroundColor: "#111410",
  android: {
    allowMixedContent: false,
    backgroundColor: "#111410",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: "#111410",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#111410",
    },
  },
};

export default config;
