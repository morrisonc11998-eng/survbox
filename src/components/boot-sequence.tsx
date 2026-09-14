import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";

const KEY = "survbox-boot-v1";

export function BootSequence({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const landed = useRef(false);
  const stuckRef = useRef(0);
  const [phase, setPhase] = useState<"boot" | "out" | "done">(() => {
    try {
      return sessionStorage.getItem(KEY) === "1" ? "done" : "boot";
    } catch {
      return "boot";
    }
  });
  const [armed, setArmed] = useState(false);

  const finish = useCallback(() => {
    if (stuckRef.current) {
      window.clearTimeout(stuckRef.current);
      stuckRef.current = 0;
    }
    setPhase((p) => (p === "done" ? p : "out"));
    window.setTimeout(() => {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
      setPhase("done");
    }, 280);
  }, []);

  useEffect(() => {
    if (!landed.current) {
      landed.current = true;
      if (router.history.location.pathname !== "/") {
        router.history.replace("/");
      }
    }
    try {
      if (sessionStorage.getItem(KEY) === "1") {
        setPhase("done");
        return;
      }
    } catch {
      /* play anyway */
    }
    const el = videoRef.current;
    if (el) {
      el.muted = true;
      const play = el.play();
      if (play) play.catch(finish);
    }
    stuckRef.current = window.setTimeout(finish, 12000);
    return () => {
      if (stuckRef.current) window.clearTimeout(stuckRef.current);
    };
  }, [finish, router]);

  function tap() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    setArmed(true);
    el.play().catch(finish);
  }

  if (phase === "done") return <>{children}</>;

  return (
    <>
      {children}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-bg transition-opacity duration-300 ${
          phase === "out" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        onClick={tap}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") tap();
        }}
        role="dialog"
        aria-label="C-Forged boot sequence"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          src="/c-forged-boot.mp4"
          playsInline
          muted
          autoPlay
          preload="auto"
          onEnded={finish}
          onError={finish}
        />
        <button
          type="button"
          className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-10 min-h-11 rounded-md border border-border bg-raised/80 px-4 font-display text-sm tracking-widest text-muted uppercase"
          onClick={(e) => {
            e.stopPropagation();
            finish();
          }}
        >
          Skip
        </button>
        {!armed ? (
          <p className="pointer-events-none absolute bottom-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem))] font-display text-xs tracking-[0.28em] text-muted uppercase">
            Tap for audio
          </p>
        ) : null}
      </div>
    </>
  );
}
