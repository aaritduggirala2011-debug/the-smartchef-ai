import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateRecipeIdeas } from "./recipe-gen.server";

export const suggestRecipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ note: z.string().max(300).optional() }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: pantry }, { data: logs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("pantry_items").select("name").eq("user_id", userId),
      supabase
        .from("meal_logs")
        .select("calories, protein, carbs, fat")
        .eq("user_id", userId)
        .gte("logged_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

    const eaten = (logs ?? []).reduce(
      (a, r) => ({
        calories: a.calories + (r.calories ?? 0),
        protein: a.protein + (r.protein ?? 0),
        carbs: a.carbs + (r.carbs ?? 0),
        fat: a.fat + (r.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const recipes = await generateRecipeIdeas({
      pantry: (pantry ?? []).map((p) => p.name),
      diet: profile?.diet_restrictions ?? [],
      allergies: profile?.allergies ?? [],
      skill: profile?.skill_level ?? "beginner",
      remaining: {
        calories: Math.max(200, (profile?.calorie_target ?? 2000) - eaten.calories),
        protein: Math.max(10, (profile?.protein_target ?? 150) - eaten.protein),
        carbs: Math.max(10, (profile?.carbs_target ?? 200) - eaten.carbs),
        fat: Math.max(5, (profile?.fat_target ?? 65) - eaten.fat),
      },
      ...(data.note ? { note: data.note } : {}),
    });

    const { data: inserted, error } = await supabase
      .from("recipes")
      .insert(recipes.map((r) => ({ ...r, user_id: userId })))
      .select();

    if (error) throw new Error(error.message);
    return { recipes: inserted ?? [] };
  });
