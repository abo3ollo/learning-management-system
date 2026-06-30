// hooks/useExamSecurity.ts

import { useState, useEffect, useCallback, useRef } from "react";

interface UseExamSecurityProps {
  maxExitAttempts?: number;
  enabled?: boolean;
  onMaxAttempts?: () => void;
}

export function useExamSecurity({
  maxExitAttempts = 3,
  enabled = true,
  onMaxAttempts,
}: UseExamSecurityProps = {}) {
  const [exitCount, setExitCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ✅ Refs to avoid effect re-runs and loops
  const fullscreenAttemptRef = useRef(false);
  const mountedRef            = useRef(true);
  const reentryTimeoutRef     = useRef<NodeJS.Timeout | null>(null);
  const onMaxAttemptsRef      = useRef(onMaxAttempts);
  onMaxAttemptsRef.current = onMaxAttempts; // always latest, no dep needed

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (reentryTimeoutRef.current) clearTimeout(reentryTimeoutRef.current);
    };
  }, []);

  // ✅ Stable forever — no dependency on state that it itself changes
  const requestFullscreen = useCallback(async () => {
    if (fullscreenAttemptRef.current || document.fullscreenElement) return;

    fullscreenAttemptRef.current = true;
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      }
    } catch {
      // Fullscreen blocked or unsupported — silently ignore
    } finally {
      // Release the lock after a short cooldown
      setTimeout(() => {
        fullscreenAttemptRef.current = false;
      }, 1000);
    }
  }, []); // ✅ no deps — never recreated

  const registerExit = useCallback((label: string) => {
    setExitCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= maxExitAttempts) {
        setWarningMessage(`⚠️ تم تجاوز الحد الأقصى (${maxExitAttempts})`);
        onMaxAttemptsRef.current?.();
      } else {
        setWarningMessage(`⚠️ ${label} ${newCount}/${maxExitAttempts}`);
      }
      return newCount;
    });
  }, [maxExitAttempts]);

  // ✅ Fullscreen change listener — runs once per `enabled` toggle
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      if (mountedRef.current) setIsFullscreen(isFull);

      if (!isFull && !fullscreenAttemptRef.current) {
        registerExit("محاولة الخروج");

        // ✅ Only ONE pending re-entry attempt at a time
        if (reentryTimeoutRef.current) clearTimeout(reentryTimeoutRef.current);
        reentryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && enabled) requestFullscreen();
        }, 1500);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    // ✅ requestFullscreen and registerExit are stable, safe to include
  }, [enabled, requestFullscreen, registerExit]);

  // ✅ Prevent tab close
  useEffect(() => {
    if (!enabled) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);

  // ✅ Prevent back navigation — runs once
  useEffect(() => {
    if (!enabled) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      registerExit("محاولة الرجوع");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enabled, registerExit]);

  // ✅ Block specific keys
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F5" || e.key === "F12") {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey && (e.key === "w" || e.key === "r")) || (e.altKey && e.key === "Tab")) {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  // ✅ Visibility change — debounced, single re-entry attempt
  useEffect(() => {
    if (!enabled) return;

    let hiddenTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTimer = setTimeout(() => {
          if (document.hidden && mountedRef.current) {
            registerExit("مغادرة الصفحة");
          }
        }, 2000);
      } else {
        if (hiddenTimer) clearTimeout(hiddenTimer);
        if (!document.fullscreenElement && !fullscreenAttemptRef.current) {
          requestFullscreen();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (hiddenTimer) clearTimeout(hiddenTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, registerExit, requestFullscreen]);

  // ✅ Initial fullscreen request — runs once when enabled flips true
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => requestFullscreen(), 500);
    return () => clearTimeout(timer);
    // ✅ requestFullscreen is stable — this effect runs only when `enabled` changes
  }, [enabled, requestFullscreen]);

  return {
    isFullscreen,
    exitCount,
    warningMessage,
    requestFullscreen,
    maxExitAttempts,
  };
}