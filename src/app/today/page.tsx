"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/** "Today" was merged into Focus (timer, daily to-do and study hours live there now). */
export default function TodayRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/focus");
  }, [router]);
  return null;
}
