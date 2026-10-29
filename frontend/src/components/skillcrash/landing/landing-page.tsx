"use client";

import { SiteNav } from "./site-nav";
import { Hero } from "./hero";
import { Problem } from "./problem";
import { Workflow } from "./workflow";
import { ReplayPreview } from "./replay-preview";
import { Safety } from "./safety";
import { ImprovementSection } from "./improvement";
import { FinalCta, SiteFooter } from "./final-cta";

/**
 * The immersive SkillCrash landing experience: scroll-driven storytelling
 * from the hero execution graph, through the problem and the five-stage
 * workflow, into a live Execution Replay, the safety boundaries, the
 * suggested improvement, and the final call to action.
 */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-base">
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <Problem />
        <Workflow />
        <ReplayPreview />
        <Safety />
        <ImprovementSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
