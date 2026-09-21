"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Custom hook to smoothly interpolate numerical values over time (e.g. 2.5s)
 * using requestAnimationFrame to create real-time fluid transitions between ESP32 packets.
 */
export function useAnimatedNumber(targetValue: number, durationMs: number = 2500, decimals: number = 0): number {
  const [currentValue, setCurrentValue] = useState<number>(targetValue);
  const startValueRef = useRef<number>(targetValue);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = currentValue;
    const endVal = targetValue;

    if (startVal === endVal) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Smooth ease-out cubic curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const interpolated = startVal + (endVal - startVal) * easeProgress;
      
      const factor = Math.pow(10, decimals);
      setCurrentValue(Math.round(interpolated * factor) / factor);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        startValueRef.current = targetValue;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetValue, durationMs, decimals]);

  return currentValue;
}
