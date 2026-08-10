import { Progress } from "@/components/ui/progress";

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
      <Progress
        value={pct}
        className="mt-2 h-2.5"
        indicatorClassName={tone === "terracotta" ? "bg-terracotta" : "bg-primary"}
      />
    </div>
  );
}
