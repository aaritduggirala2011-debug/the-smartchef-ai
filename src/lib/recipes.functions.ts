import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateRecipeIdeas } from "./recipe-gen.server";

const InputSchema = z.object({
  note: z.string().max(300).optional(),
  pantry: z.array(z.string().max(80)).max(80).default([]),
  diet: z.array(z.string().max(40)).max(20).default([]),
  allergies: z.array(z.string().max(40)).max(20).default([]),
  skill: z.string().max(20).default("beginner"),
  remaining: z
    .object({
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    })
    .default({ calories: 2000, protein: 150, carbs: 200, fat: 65 }),
});

export const suggestRecipes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const recipes = await generateRecipeIdeas({
      pantry: data.pantry,
      diet: data.diet,
      allergies: data.allergies,
      skill: data.skill,
      remaining: {
        calories: Math.max(200, Math.round(data.remaining.calories)),
        protein: Math.max(10, Math.round(data.remaining.protein)),
        carbs: Math.max(10, Math.round(data.remaining.carbs)),
        fat: Math.max(5, Math.round(data.remaining.fat)),
      },
      ...(data.note ? { note: data.note } : {}),
    });

    return { recipes };
  });
