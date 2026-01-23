"use client";

import { useEffect } from "react";

export default function ConsoleCleanup() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalError = console.error;
      console.error = (...args) => {
        // Filter out specific network errors that are expected in offline/demo modes
        if (
          /AbortError|signal is aborted|timeout|fetch failed|network|connection/i.test(
            args[0]?.toString() || ""
          )
        ) {
          return;
        }
        originalError.apply(console, args);
      };
    }
  }, []);

  return null;
}
