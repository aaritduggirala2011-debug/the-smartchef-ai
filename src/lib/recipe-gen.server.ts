import { streamText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { RecipeListSchema, type GeneratedRecipe } from "./recipe-schema";

export type GenerateInput = {
  pantry: string[];
  diet: string[];
  allergies: string[];
  skill: string;
  remaining: { calories: number; protein: number; carbs: number; fat: number };
  note?: string;
};

export async function generateRecipeIdeas(input: GenerateInput): Promise<GeneratedRecipe[]> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");

  const gateway = createLovableAiGatewayProvider(key);

  const prompt = [
    `Create 3 distinct recipes a home cook can make mostly from these pantry ingredients: ${input.pantry.join(", ") || "basic staples"}.`,
    `Dietary restrictions that MUST be respected: ${input.diet.join(", ") || "none"}.`,
    `Allergies to strictly avoid: ${input.allergies.join(", ") || "none"}.`,
    `Cook skill level: ${input.skill}. Match step complexity and difficulty to this level.`,
    `Remaining macro budget for the rest of today: ${input.remaining.calories} kcal, ${input.remaining.protein}g protein, ${input.remaining.carbs}g carbs, ${input.remaining.fat}g fat. Each recipe (per serving) should comfortably fit inside that budget and help hit the protein goal.`,
    input.note ? `Extra request from the cook: ${input.note}` : "",
    `Nutrition numbers are per serving. Keep missing_ingredients short (things not in the pantry). Include practical substitutions.`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = streamText({
    model: gateway("google/gemini-3.6-flash"),
    system:
      "You are Smart Chef, a warm, practical cooking coach who is precise about nutrition. Always return realistic macro estimates.",
    prompt,
    output: Output.object({ schema: RecipeListSchema }),
  });

  const output = await result.output;
  return output.recipes;
}
