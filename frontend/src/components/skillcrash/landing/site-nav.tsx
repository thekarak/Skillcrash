"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useOpenWorkspace } from "@/lib/skillcrash/store";
import { SkillCrashWordmark } from "../shared/wordmark";

const LINKS = [
  { href: "#product", label: "Case Study" },
  { href: "#workflow", label: "Architecture" },
  { href: "#safety", label: "Security & Isolation" },
  { href: "#open-source", label: "Specifications" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const openWorkspace = useOpenWorkspace();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const sections = LINKS.map((l) => document.querySelector<HTMLElement>(l.href)).filter(
      (el): el is HTMLElement => el !== null
    );
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0.05, 0.25, 0.5] }
    );
    sections.forEach((s) => io.observe(s));
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "border-b border-line bg-base/85 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <div className="sc-container-wide flex h-20 items-center justify-between gap-6">
        <a
          href="#top"
          aria-label="SkillCrash — back to top"
          className="transition-opacity hover:opacity-85 -ml-1 sm:-ml-1.5"
        >
          <SkillCrashWordmark withTag size="lg" />
        </a>

        <nav aria-label="Site sections" className="hidden items-center gap-1.5 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={active === l.href ? "true" : undefined}
              className={cn(
                "rounded-md px-3.5 py-2 text-[13.5px] font-medium transition-colors",
                active === l.href ? "text-accent font-semibold" : "text-ink-2 hover:text-ink"
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="default"
            className="hidden h-10 bg-accent px-5 font-semibold text-primary-foreground shadow-sm hover:bg-accent/85 sm:inline-flex"
            onClick={() => openWorkspace()}
          >
            Open Workspace <ArrowRight className="h-4 w-4" />
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="rounded-md border border-line p-2 text-ink-2 hover:text-ink md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] border-line bg-surface p-0">
              <SheetHeader className="border-b border-line px-5 py-5">
                <SheetTitle asChild>
                  <div>
                    <SkillCrashWordmark size="md" />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 py-5" aria-label="Mobile site sections">
                {LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3.5 py-2.5 text-[14px] font-medium text-ink-2 hover:bg-raised hover:text-ink"
                  >
                    {l.label}
                  </a>
                ))}
                <Button
                  type="button"
                  size="default"
                  className="mt-4 bg-accent font-semibold text-primary-foreground hover:bg-accent/85"
                  onClick={() => {
                    setOpen(false);
                    openWorkspace();
                  }}
                >
                  Open Workspace <ArrowRight className="h-4 w-4" />
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
