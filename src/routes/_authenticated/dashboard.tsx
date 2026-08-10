import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MacroBar } from "@/components/MacroBar";
import { Button } from "@/components/ui/button";
import { sumMacros, startOfToday, startOfWeek } from "@/lib/nutrition";
import { Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Macro dashboard — Smart Chef" },
      {
        name: "description",
        content: "See today's and this week's calories, protein, carbs and fat against your targets.",
      },
      { property: "og:title", content: "Macro dashboard — Smart Chef" },
      { property: "og:description", content: "Track logged meals against your daily macro goals." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });

  const { data: weekLogs = [] } = useQuery({
    queryKey: ["logs", "week"],
    queryFn: async () =>
      (
        await supabase
          .from("meal_logs")
          .select("*")
          .gte("logged_at", startOfWeek().toISOString())
          .order("logged_at", { ascending: false })
      ).data ?? [],
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logs"] });
      toast.success("Meal removed");
    },
  });

  const todayStart = startOfToday();
  const todayLogs = weekLogs.filter((l) => new Date(l.logged_at) >= todayStart);
  const today = sumMacros(todayLogs);
  const week = sumMacros(weekLogs);

  const targets = {
    calories: profile?.calorie_target ?? 2000,
    protein: profile?.protein_target ?? 150,
    carbs: profile?.carbs_target ?? 200,
    fat: profile?.fat_target ?? 65,
  };

  const daysElapsed = Math.max(1, Math.round((Date.now() - startOfWeek().getTime()) / 86400000) + 1);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            Hi{profile?.display_name ? `, ${profile.display_name}` : ""} 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            {Math.max(0, targets.calories - today.calories)} kcal and{" "}
            {Math.max(0, targets.protein - today.protein)}g protein left today.
          </p>
        </div>
        <Button asChild>
          <Link to="/recipes">
            <Sparkles className="size-4" /> Find a meal
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold">Today</h2>
          <div className="mt-5 space-y-5">
            <MacroBar label="Calories" value={today.calories} target={targets.calories} unit=" kcal" />
            <MacroBar label="Protein" value={today.protein} target={targets.protein} />
            <MacroBar label="Carbs" value={today.carbs} target={targets.carbs} tone="terracotta" />
            <MacroBar label="Fat" value={today.fat} target={targets.fat} tone="terracotta" />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold">This week</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Averaged over {daysElapsed} day{daysElapsed > 1 ? "s" : ""}
          </p>
          <div className="mt-5 space-y-5">
            <MacroBar
              label="Avg calories / day"
              value={week.calories / daysElapsed}
              target={targets.calories}
              unit=" kcal"
            />
            <MacroBar
              label="Avg protein / day"
              value={week.protein / daysElapsed}
              target={targets.protein}
            />
            <MacroBar
              label="Avg carbs / day"
              value={week.carbs / daysElapsed}
              target={targets.carbs}
              tone="terracotta"
            />
            <MacroBar
              label="Avg fat / day"
              value={week.fat / daysElapsed}
              target={targets.fat}
              tone="terracotta"
            />
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold">Logged meals</h2>
        {weekLogs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing logged this week yet. Cook something and hit “Log this meal”.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {weekLogs.map((l) => (
              <li key={l.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{l.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(l.logged_at).toLocaleString(undefined, {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    · {l.calories} kcal · {l.protein}g protein
                  </p>
                </div>
                <button
                  onClick={() => remove.mutate(l.id)}
                  aria-label={`Remove ${l.title}`}
                  className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
