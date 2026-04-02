import { useState, useEffect } from "react";

/**
 * useIdle hook
 * @param timeout Milliseconds of inactivity before becoming idle
 * @returns boolean indicating if the user is idle
 */
export function useIdle(timeout: number = 3000) {
  const [isIdle, setIsIdle] = useState(true); // Comença en idle fins que hi hagi interacció
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIsIdle(true), timeout);
    };

    const handleActivity = () => {
      if (!hasInteracted) setHasInteracted(true);
      resetTimer();
    };

    if (typeof window === "undefined") return;

    // Listen for activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      clearTimeout(timer);
    };
  }, [timeout, hasInteracted]);

  return { isIdle, hasInteracted };
}
