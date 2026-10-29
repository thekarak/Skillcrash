"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/skillcrash/landing/landing-page";

/**
 * / — the immersive SkillCrash landing experience.
 *
 * The workspace lives at the real /workspace route. Legacy #workspace deep
 * links (from older deployments) are redirected there, preserving any test
 * intent encoded in the hash:
 *   #workspace             → /workspace
 *   #workspace/TC-004      → /workspace?test=TC-004
 *   #workspace/TC-004/run  → /workspace?test=TC-004&run=1
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const applyHash = () => {
      const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!hash.startsWith("workspace")) return;
      const rest = hash.slice("workspace".length).replace(/^\//, "");
      const [testId, action] = rest.split("/");
      const params = new URLSearchParams();
      if (testId && testId.startsWith("TC-")) {
        params.set("test", testId);
        if (action === "run") params.set("run", "1");
      }
      const qs = params.toString();
      // Clear the hash so section anchors keep working after returning.
      window.history.replaceState(null, "", window.location.pathname);
      router.replace(`/workspace${qs ? `?${qs}` : ""}`);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [router]);

  return <LandingPage />;
}
