import { cn } from "@/lib/utils";

export function MacroBar({
  label,
  value,
  target,
  unit = "g",
  tone = "primary",
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
  tone?: "primary" | "terracotta";
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = value > target;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          <span className={over ? "font-semibold text-terracotta" : "font-semibold text-foreground"}>
            {Math.round(value)}
          </span>{" "}
          / {target}
          {unit}
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            over ? "bg-terracotta" : tone === "terracotta" ? "bg-terracotta" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
