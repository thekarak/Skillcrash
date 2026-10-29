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
    <nav aria-label="Workspace sections" className="flex flex-col gap-0.5">
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
              "flex items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-left text-[13px] font-medium transition-colors",
              active
                ? "border-accent/25 bg-accent/10 text-accent"
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
    <div className="mt-auto space-y-2 border-t border-line px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="sc-mono-label">sandbox</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-ok">
          <StatusDot tone="ok" pulse />
          mock · active
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="sc-mono-label">tools</span>
        <span className="font-mono text-[10px] text-ink-3">{MOCK_TOOLS.length} allowlisted</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="sc-mono-label">backend</span>
        <DemoBadge label="demo adapter" />
      </div>
    </div>
  );
}

export function WorkspaceSidebar() {
  const goLanding = useBackToLanding();

  return (
    <aside className="hidden w-[228px] shrink-0 flex-col border-r border-line bg-sidebar lg:flex">
      <div className="border-b border-line px-4 py-4">
        <button
          type="button"
          onClick={goLanding}
          className="text-left transition-opacity hover:opacity-80"
          aria-label="Back to the SkillCrash landing page"
        >
          <SkillCrashWordmark withTag />
        </button>
      </div>
      <div className="px-3 py-4">
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
          className="rounded-md border border-line p-2 text-ink-2 hover:text-ink lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[264px] flex-col border-line bg-sidebar p-0">
        <SheetHeader className="border-b border-line px-4 py-4">
          <SheetTitle asChild>
            <div>
              <SkillCrashWordmark withTag />
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="px-3 py-4">
          <NavList onNavigate={() => setOpen(false)} />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              goLanding();
            }}
            className="mt-3 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-ink-3 hover:bg-raised hover:text-ink"
          >
            ← Back to site
          </button>
        </div>
        <SidebarFooter />
      </SheetContent>
    </Sheet>
  );
}
