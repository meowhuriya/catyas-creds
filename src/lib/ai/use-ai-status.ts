"use client";

import * as React from "react";

export function useAiStatus() {
  const [configured, setConfigured] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/ai/status")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setConfigured(Boolean(data.configured ?? true));
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setConfigured(true);
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
    unconfiguredMessage: "",
  };
}
