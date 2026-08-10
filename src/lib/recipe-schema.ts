import { z } from "zod";

export const RecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  minutes: z.number().int().min(5).max(240),
  servings: z.number().int().min(1).max(8),
  calories: z.number().int().min(0),
  protein: z.number().int().min(0),
  carbs: z.number().int().min(0),
  fat: z.number().int().min(0),
  tags: z.array(z.string()).max(6),
  ingredients: z.array(z.object({ item: z.string(), amount: z.string() })).max(20),
  missing_ingredients: z.array(z.string()).max(8),
  steps: z.array(z.string()).min(2).max(14),
  substitutions: z.array(z.object({ ingredient: z.string(), swap: z.string() })).max(6),
});

export const RecipeListSchema = z.object({ recipes: z.array(RecipeSchema).min(1).max(4) });

export type GeneratedRecipe = z.infer<typeof RecipeSchema>;

export type RecipeRow = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  minutes: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  ingredients: { item: string; amount: string }[];
  missing_ingredients: string[];
  steps: string[];
  substitutions: { ingredient: string; swap: string }[];
  created_at: string;
};
