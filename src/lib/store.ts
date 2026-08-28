import type { GeneratedRecipe, RecipeRow } from "./recipe-schema";

export type Profile = {
  display_name: string;
  diet_restrictions: string[];
  allergies: string[];
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  skill_level: string;
  subscription_tier: string;
  onboarded: boolean;
};

export type PantryItem = { id: string; name: string; created_at: string };

export type MealLog = {
  id: string;
  recipe_id: string | null;
  title: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
};

export const defaultProfile: Profile = {
  display_name: "",
  diet_restrictions: [],
  allergies: [],
  calorie_target: 2000,
  protein_target: 150,
  carbs_target: 200,
  fat_target: 65,
  skill_level: "beginner",
  subscription_tier: "free",
  onboarded: false,
};

const KEYS = {
  profile: "smartchef.profile",
  pantry: "smartchef.pantry",
  recipes: "smartchef.recipes",
  logs: "smartchef.logs",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function id() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/* Profile */
export function getProfile(): Profile {
  return { ...defaultProfile, ...read<Partial<Profile>>(KEYS.profile, {}) };
}

export function saveProfile(patch: Partial<Profile>): Profile {
  const next = { ...getProfile(), ...patch };
  write(KEYS.profile, next);
  return next;
}

/* Pantry */
export function getPantry(): PantryItem[] {
  return read<PantryItem[]>(KEYS.pantry, []);
}

export function addPantryItem(name: string): PantryItem[] {
  const items = getPantry();
  const next = [{ id: id(), name, created_at: new Date().toISOString() }, ...items];
  write(KEYS.pantry, next);
  return next;
}

export function removePantryItem(itemId: string): PantryItem[] {
  const next = getPantry().filter((i) => i.id !== itemId);
  write(KEYS.pantry, next);
  return next;
}

/* Recipes */
export function getRecipes(): RecipeRow[] {
  return read<RecipeRow[]>(KEYS.recipes, []);
}

export function getRecipe(recipeId: string): RecipeRow | null {
  return getRecipes().find((r) => r.id === recipeId) ?? null;
}

export function addRecipes(recipes: GeneratedRecipe[]): RecipeRow[] {
  const rows: RecipeRow[] = recipes.map((r) => ({
    ...r,
    id: id(),
    created_at: new Date().toISOString(),
  }));
  const next = [...rows, ...getRecipes()].slice(0, 48);
  write(KEYS.recipes, next);
  return next;
}

/* Meal logs */
export function getLogs(): MealLog[] {
  return read<MealLog[]>(KEYS.logs, []).sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime(),
  );
}

export function addLog(log: Omit<MealLog, "id" | "logged_at">): MealLog[] {
  const next = [{ ...log, id: id(), logged_at: new Date().toISOString() }, ...getLogs()];
  write(KEYS.logs, next);
  return next;
}

export function removeLog(logId: string): MealLog[] {
  const next = getLogs().filter((l) => l.id !== logId);
  write(KEYS.logs, next);
  return next;
}
