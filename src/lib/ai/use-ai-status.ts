"use client";

import * as React from "react";

export function useAiStatus() {
  const [configured, setConfigured] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/ai/status")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setConfigured(Boolean(data.configured));
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setConfigured(false);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    configured,
    loading,
    unconfiguredMessage:
      "Gemini API key not configured. Add GEMINI_API_KEY to .env to enable AI features",
  };
}
