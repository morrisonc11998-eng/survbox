import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

/** Android back, status bar, and splash. No-op in the browser. */
export function NativeShell() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
    void StatusBar.setBackgroundColor({ color: "#111410" }).catch(() => undefined);
    void SplashScreen.hide().catch(() => undefined);

    const sub = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack || router.history.location.pathname !== "/") {
        router.history.back();
        return;
      }
      void App.exitApp();
    });

    return () => {
      void sub.then((h) => h.remove());
    };
  }, [router]);

  return null;
}
