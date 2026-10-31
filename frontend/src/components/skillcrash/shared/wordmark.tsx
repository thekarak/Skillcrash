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
      className={cn("h-7 w-7 shrink-0", className)}
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
  size = "md",
}: {
  className?: string;
  markClassName?: string;
  withTag?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const isLg = size === "lg" || size === "xl";
  return (
    <span className={cn("inline-flex items-center", isLg ? "gap-3.5" : "gap-2.5", className)}>
      <SkillCrashMark
        className={cn(
          isLg ? "h-9 w-9 sm:h-10 sm:w-10 drop-shadow-sm" : "h-6 w-6",
          markClassName
        )}
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "tracking-tight text-ink",
            isLg ? "text-[20px] sm:text-[23px] font-bold" : "text-[15px] font-semibold"
          )}
        >
          Skill<span className="sc-text-accent">Crash</span>
        </span>
        {withTag && (
          <span
            className={cn(
              "font-mono uppercase tracking-[0.2em]",
              isLg
                ? "mt-1.5 text-[10px] sm:text-[10.5px] font-semibold text-ink-2"
                : "mt-1 text-[9px] text-ink-3"
            )}
          >
            adversarial skill testing
          </span>
        )}
      </span>
    </span>
  );
}
