import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function FieldTimer({
  label,
  onStop,
}: {
  label: string;
  onStop: (seconds: number) => void;
}) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const wakeRef = useRef<{ release: () => void } | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsed((performance.now() - startRef.current) / 1000);
    }, 50);
    return () => window.clearInterval(id);
  }, [running]);

  async function start() {
    startRef.current = performance.now();
    setElapsed(0);
    setRunning(true);
    try {
      navigator.vibrate?.(40);
    } catch {
      /* ignore */
    }
    try {
      const anyNav = navigator as Navigator & {
        wakeLock?: { request: (t: "screen") => Promise<{ release: () => void }> };
      };
      wakeRef.current = (await anyNav.wakeLock?.request("screen")) ?? null;
    } catch {
      wakeRef.current = null;
    }
  }

  function stop() {
    const sec = (performance.now() - startRef.current) / 1000;
    setRunning(false);
    setElapsed(sec);
    onStop(sec);
    try {
      navigator.vibrate?.([20, 40, 20]);
    } catch {
      /* ignore */
    }
    try {
      wakeRef.current?.release();
    } catch {
      /* ignore */
    }
    wakeRef.current = null;
  }

  return (
    <div className="rounded-lg border border-border bg-raised p-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 font-mono text-4xl tabular-nums tracking-tight">
        {elapsed.toFixed(2)}
        <span className="ml-1 text-base text-muted">s</span>
      </p>
      <div className="mt-3">
        {running ? (
          <Button variant="danger" className="w-full min-h-12 text-base" onClick={stop}>
            Stop
          </Button>
        ) : (
          <Button className="w-full min-h-12 text-base" onClick={start}>
            Start
          </Button>
        )}
      </div>
    </div>
  );
}
