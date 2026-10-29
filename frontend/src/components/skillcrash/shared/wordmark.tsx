import { cn } from "@/lib/utils";

/**
 * SkillCrash wordmark + custom symbol.
 * A bone tile with an ink border, a vermilion fault-bolt and two copper
 * fracture strikes — "the moment a skill breaks under test".
 */
export function SkillCrashMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-6 shrink-0", className)}
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="6" fill="#EEE8DC" stroke="#171613" strokeWidth="1.6" />
      <path d="M17.5 6.5 10.5 17.5h4.2l-1.7 8 8.5-11.5h-4.6l1.8-7.5z" fill="#E0231C" />
      <path d="M8 23.5l3 3M24 8l-3-3" stroke="#A56F50" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SkillCrashWordmark({
  className,
  markClassName,
  withTag = false,
}: {
  className?: string;
  markClassName?: string;
  withTag?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <SkillCrashMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          Skill<span className="sc-text-accent">Crash</span>
        </span>
        {withTag && (
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
            adversarial skill testing
          </span>
        )}
      </span>
    </span>
  );
}
