"use client";

import { useState } from "react";
import {
  FlaskConical,
  LayoutDashboard,
  Library,
  Menu,
  Scale,
  Settings,
  Wrench,
} from "lucide-react";
import { useSkillCrash, useBackToLanding } from "@/lib/skillcrash/store";
import type { WorkspaceNavKey } from "@/lib/skillcrash/types";
import { cn } from "@/lib/utils";
import { SkillCrashWordmark } from "../shared/wordmark";
import { StatusDot, DemoBadge } from "../shared/badges";
import { MOCK_TOOLS } from "@/lib/skillcrash/sandbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const NAV_ITEMS: {
  key: WorkspaceNavKey;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "runs", label: "Test Runs", icon: FlaskConical },
  { key: "library", label: "Skill Library", icon: Library },
  { key: "tools", label: "Mock Tools", icon: Wrench },
  { key: "rules", label: "Evaluation Rules", icon: Scale },
  { key: "settings", label: "Settings", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const nav = useSkillCrash((s) => s.nav);
  const setNav = useSkillCrash((s) => s.setNav);

  return (
    <nav aria-label="Workspace sections" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = nav === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setNav(item.key);
              onNavigate?.();
            }}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md border border-transparent px-3.5 py-2.5 text-left text-[14px] font-medium transition-colors cursor-pointer",
              active
                ? "border-accent/25 bg-accent/10 text-accent font-semibold"
                : "text-ink-2 hover:bg-raised hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto space-y-2.5 border-t border-line px-4 py-3.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-ink-3">Sandbox</span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-ok">
          <StatusDot tone="ok" pulse />
          Safe In-Memory
        </span>
      </div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-ink-3">Virtual Tools</span>
        <span className="font-semibold text-ink-2">{MOCK_TOOLS.length} Ready</span>
      </div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-ink-3">Runtime</span>
        <DemoBadge label="In-Memory Demo" />
      </div>
    </div>
  );
}

export function WorkspaceSidebar() {
  const goLanding = useBackToLanding();

  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-line bg-sidebar lg:flex">
      <div className="border-b border-line px-5 py-4">
        <button
          type="button"
          onClick={goLanding}
          className="text-left transition-opacity hover:opacity-85 cursor-pointer"
          aria-label="Back to the SkillCrash landing page"
        >
          <SkillCrashWordmark withTag size="md" />
        </button>
      </div>
      <div className="px-3.5 py-4">
        <NavList />
      </div>
      <SidebarFooter />
    </aside>
  );
}

/** Mobile navigation: menu button (rendered in the header) + slide-over sheet. */
export function MobileNavSheet() {
  const goLanding = useBackToLanding();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open workspace navigation"
          className="rounded-md border border-line p-2 text-ink-2 hover:text-ink lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[270px] flex-col border-line bg-sidebar p-0">
        <SheetHeader className="border-b border-line px-5 py-5">
          <SheetTitle asChild>
            <div>
              <SkillCrashWordmark withTag size="md" />
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 py-4">
          <NavList onNavigate={() => setOpen(false)} />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              goLanding();
            }}
            className="mt-4 flex w-full items-center gap-2.5 rounded-md px-3.5 py-2.5 text-left text-[14px] font-medium text-ink-3 hover:bg-raised hover:text-ink cursor-pointer"
          >
            ← Back to Home
          </button>
        </div>
        <SidebarFooter />
      </SheetContent>
    </Sheet>
  );
}
