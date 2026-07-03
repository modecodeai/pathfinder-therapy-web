"use client";

import { useEffect } from "react";
import { captureLeadAttribution } from "@/lib/lead-attribution";

export function LeadAttributionCapture() {
  useEffect(() => {
    captureLeadAttribution();
  }, []);

  return null;
}
