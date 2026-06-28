import { useEffect, useState } from "react";
import { subscribeMockStore } from "@/lib/mock-data";

/** Re-renders the calling component whenever the in-memory mock store changes. */
export function useMockStore() {
  const [, setTick] = useState(0);
  useEffect(() => subscribeMockStore(() => setTick((t) => t + 1)), []);
}