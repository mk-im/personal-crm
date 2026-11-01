"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RefreshOnMount() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
    // Refresh once when the screen opens so the form is not served from a stale visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on mount only
  }, []);

  return null;
}
