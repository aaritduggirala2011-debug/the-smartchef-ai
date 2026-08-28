import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { suggestRecipes } from "@/lib/recipes.functions";
import { addRecipes, getLogs, getPantry, getProfile, getRecipes } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Clock, Flame, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { sumMacros, startOfToday } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/recipes/")({
  head: () => ({
    meta: [
      { title: "Recipe suggestions — Smart Chef" },
      {
        name: "description",
        content:
          "Recipes matched to your pantry, dietary needs and the macros you have left for today.",
      },
      { property: "og:title", content: "Recipe suggestions — Smart Chef" },
      { property: "og:description", content: "Fresh ideas built from ingredients you already own." },
    ],
  }),
  component: RecipesPage,
});

function RecipesPage() {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const generate = useServerFn(suggestRecipes);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const { data: pantry = [] } = useQuery({ queryKey: ["pantry"], queryFn: () => getPantry() });
  const { data: todayLogs = [] } = useQuery({
    queryKey: ["logs", "today"],
    queryFn: () => getLogs().filter((l) => new Date(l.logged_at) >= startOfToday()),
  });
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => getRecipes(),
  });

  const eaten = sumMacros(todayLogs);
  const remaining = {
    calories: (profile?.calorie_target ?? 2000) - eaten.calories,
    protein: (profile?.protein_target ?? 150) - eaten.protein,
    carbs: (profile?.carbs_target ?? 200) - eaten.carbs,
    fat: (profile?.fat_target ?? 65) - eaten.fat,
  };

  const run = useMutation({
    mutationFn: async () => {
      const result = await generate({
        data: {
          note: note.trim() || undefined,
          pantry: pantry.map((p) => p.name),
          diet: profile?.diet_restrictions ?? [],
          allergies: profile?.allergies ?? [],
          skill: profile?.skill_level ?? "beginner",
          remaining,
        },
      });
      addRecipes(result.recipes);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Fresh recipes ready!");
      setNote("");
    },
    onError: () => toast.error("Couldn't generate recipes right now. Please try again."),
  });

  const fits = (r: { calories: number }) => r.calories <= Math.max(0, remaining.calories);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Tonight's matches</h1>
          <p className="mt-2 text-muted-foreground">
            {pantry.length} ingredients on hand · {Math.max(0, Math.round(remaining.calories))} kcal
            and {Math.max(0, Math.round(remaining.protein))}g protein left today
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/pantry">Edit pantry</Link>
        </Button>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional: 'something quick and warming'"
            className="h-12 rounded-2xl"
          />
          <Button
            size="lg"
            className="rounded-2xl"
            disabled={run.isPending || pantry.length === 0}
            onClick={() => run.mutate()}
          >
            <Sparkles className="size-4" />
            {run.isPending ? "Cooking up ideas…" : "Suggest recipes"}
          </Button>
        </div>
        {pantry.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Add a few ingredients to your pantry first.
          </p>
        )}
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : recipes.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-12 text-center">
          <ChefHat className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No recipes yet</p>
          <p className="text-sm text-muted-foreground">
            Hit “Suggest recipes” and Smart Chef will build a few around your pantry.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <Link
              key={r.id}
              to="/recipes/$id"
              params={{ id: r.id }}
              className="group flex flex-col rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                    r.difficulty === "easy"
                      ? "bg-accent text-accent-foreground"
                      : "bg-terracotta/15 text-terracotta",
                  )}
                >
                  {r.difficulty}
                </span>
                {fits(r) && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    Fits today
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-lg leading-snug font-semibold group-hover:text-primary">
                {r.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> {r.minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="size-3.5" /> {r.calories} kcal
                </span>
                <span>{r.protein}g protein</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
