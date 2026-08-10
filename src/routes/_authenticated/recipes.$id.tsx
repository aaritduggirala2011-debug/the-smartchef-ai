import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Users, Flame, Replace, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/recipes/$id")({
  head: () => ({
    meta: [
      { title: "Recipe — Smart Chef" },
      {
        name: "description",
        content: "Step-by-step instructions, macro breakdown and smart substitutions for your recipe.",
      },
      { property: "og:title", content: "Recipe — Smart Chef" },
      { property: "og:description", content: "Instructions, macros and substitutions in one place." },
    ],
  }),
  component: RecipeDetail,
});

type Ingredient = { item: string; amount: string };
type Substitution = { ingredient: string; swap: string };

function RecipeDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const log = useMutation({
    mutationFn: async () => {
      if (!recipe) return;
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("meal_logs").insert({
        user_id: uid,
        recipe_id: recipe.id,
        title: recipe.title,
        servings: 1,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logs"] });
      toast.success("Meal logged — macros updated");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading recipe…</p>;
  if (!recipe)
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center">
        <p className="font-medium">Recipe not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/recipes">Back to suggestions</Link>
        </Button>
      </div>
    );

  const ingredients = (recipe.ingredients ?? []) as unknown as Ingredient[];
  const steps = (recipe.steps ?? []) as unknown as string[];
  const subs = (recipe.substitutions ?? []) as unknown as Substitution[];
  const missing = (recipe.missing_ingredients ?? []) as unknown as string[];

  const macros = [
    { label: "Calories", value: `${recipe.calories}`, unit: "kcal" },
    { label: "Protein", value: `${recipe.protein}`, unit: "g" },
    { label: "Carbs", value: `${recipe.carbs}`, unit: "g" },
    { label: "Fat", value: `${recipe.fat}`, unit: "g" },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/recipes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All suggestions
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
            recipe.difficulty === "easy"
              ? "bg-accent text-accent-foreground"
              : "bg-terracotta/15 text-terracotta",
          )}
        >
          {recipe.difficulty}
        </span>
        {recipe.tags?.map((t: string) => (
          <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
            {t}
          </span>
        ))}
      </div>

      <h1 className="mt-3 text-4xl font-semibold text-balance">{recipe.title}</h1>
      <p className="mt-3 text-muted-foreground">{recipe.description}</p>

      <div className="mt-4 flex flex-wrap gap-5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" /> {recipe.minutes} min
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-4" /> {recipe.servings} serving{recipe.servings > 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <Flame className="size-4" /> {recipe.calories} kcal / serving
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {macros.map((m) => (
          <div key={m.label} className="rounded-2xl bg-cream p-4 text-center">
            <p className="font-display text-2xl font-semibold">{m.value}</p>
            <p className="text-xs text-muted-foreground">
              {m.label} ({m.unit})
            </p>
          </div>
        ))}
      </div>

      <Button size="lg" className="mt-6 w-full rounded-2xl" onClick={() => log.mutate()} disabled={log.isPending}>
        <CheckCircle2 className="size-4" />
        {log.isPending ? "Logging…" : "Log this meal"}
      </Button>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold">Ingredients</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {ingredients.map((ing, i) => (
              <li key={i} className="flex justify-between gap-4 border-b border-border/60 pb-2">
                <span>{ing.item}</span>
                <span className="text-muted-foreground">{ing.amount}</span>
              </li>
            ))}
          </ul>
          {missing.length > 0 && (
            <p className="mt-4 rounded-2xl bg-terracotta/10 p-3 text-sm text-terracotta">
              You may need: {missing.join(", ")}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Replace className="size-4" /> Substitutions
          </h2>
          {subs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No swaps needed for this one.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {subs.map((s, i) => (
                <li key={i}>
                  <span className="font-medium">{s.ingredient}</span>
                  <span className="text-muted-foreground"> → {s.swap}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold">Method</h2>
        <ol className="mt-4 space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <p className="pt-0.5 text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
