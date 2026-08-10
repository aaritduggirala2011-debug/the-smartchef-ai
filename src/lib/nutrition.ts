export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const emptyMacros: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function sumMacros(rows: Partial<MacroTotals>[]): MacroTotals {
  return rows.reduce<MacroTotals>(
    (acc, r) => ({
      calories: acc.calories + (r.calories ?? 0),
      protein: acc.protein + (r.protein ?? 0),
      carbs: acc.carbs + (r.carbs ?? 0),
      fat: acc.fat + (r.fat ?? 0),
    }),
    { ...emptyMacros },
  );
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek() {
  const d = startOfToday();
  const day = (d.getDay() + 6) % 7; // Monday-first
  d.setDate(d.getDate() - day);
  return d;
}

export const DIET_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-free",
  "Dairy-free",
  "Keto",
  "Low-carb",
  "Halal",
  "Kosher",
  "Nut-free",
];

export const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner", hint: "Simple steps, few pans" },
  { value: "intermediate", label: "Intermediate", hint: "Comfortable with most techniques" },
  { value: "advanced", label: "Advanced", hint: "Bring on the challenge" },
];
