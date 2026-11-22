"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

/** Old address: exams moved to Exam Prep. */
export default function OldExamRoute() {
  const params = useParams<{ examId: string }>();
  const router = useRouter();
  React.useEffect(() => {
    router.replace(`/prep/${params?.examId ?? ""}`);
  }, [params, router]);
  return null;
}
