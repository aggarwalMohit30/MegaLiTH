"use client";

import { useEffect } from "react";

export default function RefCapture() {
  useEffect(() => {
    try {
      const currentUrl = new URL(window.location.href);
      const ref = currentUrl.searchParams.get("ref");

      if (ref) {
        // Persist referral code for later use in dashboard
        sessionStorage.setItem("pendingReferralCode", ref.toUpperCase());

        // Remove the query parameter from the URL without a reload
        currentUrl.searchParams.delete("ref");
        window.history.replaceState({}, "", currentUrl.toString());
      }
    } catch {
      // no-op: best effort capture only
    }
  }, []);

  return null;
}


