import { streamText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { RecipeSchema, type GeneratedRecipe } from "./recipe-schema";

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

  const base = [
    `Ingredients the cook has on hand: ${input.pantry.join(", ") || "basic staples"}.`,
    `Dietary restrictions that MUST be respected: ${input.diet.join(", ") || "none"}.`,
    `Allergies to strictly avoid: ${input.allergies.join(", ") || "none"}.`,
    `Cook skill level: ${input.skill}. Match step complexity and difficulty to this level.`,
    `Remaining macro budget for the rest of today: ${input.remaining.calories} kcal, ${input.remaining.protein}g protein, ${input.remaining.carbs}g carbs, ${input.remaining.fat}g fat. The recipe (per serving) should comfortably fit inside that budget and help hit the protein goal.`,
    input.note ? `Extra request from the cook: ${input.note}` : "",
    `Nutrition numbers are per serving. Keep missing_ingredients short (things not in the pantry). Include practical substitutions.`,
  ].filter(Boolean);

  const angles = [
    "Make it a comforting, hearty main dish.",
    "Make it a lighter, fresher dish that is quick on a weeknight.",
    "Make it a higher-protein dish with a different cooking method than a simple skillet sauté.",
  ];

  const results = await Promise.allSettled(
    angles.map(async (angle) => {
      const result = streamText({
        model: gateway("google/gemini-3.6-flash"),
        system:
          "You are Smart Chef, a warm, practical cooking coach who is precise about nutrition. Always return realistic macro estimates.",
        prompt: [`Create one recipe a home cook can make mostly from their pantry.`, angle, ...base].join("\n"),
        output: Output.object({ schema: RecipeSchema }),
      });
      return await result.output;
    }),
  );

  const recipes = results
    .filter((r): r is PromiseFulfilledResult<GeneratedRecipe> => r.status === "fulfilled")
    .map((r) => r.value);

  if (recipes.length === 0) throw new Error("Recipe generation failed");
  return recipes;
}

