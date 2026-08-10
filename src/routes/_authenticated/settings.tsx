import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIET_OPTIONS, SKILL_LEVELS } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Profile & settings — Smart Chef" },
      {
        name: "description",
        content: "Update your dietary preferences, macro targets, cooking skill and subscription tier.",
      },
      { property: "og:title", content: "Profile & settings — Smart Chef" },
      { property: "og:description", content: "Manage your Smart Chef preferences and plan." },
    ],
  }),
  component: Settings,
});

const TIERS = [
  { id: "free", name: "Home Cook", price: "Free", perks: ["3 recipe batches a day", "Macro tracking"] },
  { id: "pro", name: "Smart Chef Pro", price: "$9/mo", perks: ["Unlimited recipes", "Weekly meal plans", "Grocery lists"] },
];

function Settings() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [diet, setDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [targets, setTargets] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [skill, setSkill] = useState("beginner");
  const [tier, setTier] = useState("free");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name ?? "");
    setDiet(profile.diet_restrictions ?? []);
    setAllergies((profile.allergies ?? []).join(", "));
    setSkill(profile.skill_level);
    setTier(profile.subscription_tier);
    setTargets({
      calories: profile.calorie_target,
      protein: profile.protein_target,
      carbs: profile.carbs_target,
      fat: profile.fat_target,
    });
  }, [profile]);

  async function save(nextTier = tier) {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      toast.error("Session expired, please log in again.");
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: uid,
      display_name: name,
      diet_restrictions: diet,
      allergies: allergies
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      calorie_target: targets.calories,
      protein_target: targets.protein,
      carbs_target: targets.carbs,
      fat_target: targets.fat,
      skill_level: skill,
      subscription_tier: nextTier,
      onboarded: true,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Preferences saved");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold">Profile & settings</h1>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold">About you</h2>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="display-name">Display name</Label>
          <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold">Dietary preferences</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {DIET_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setDiet((prev) =>
                  prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option],
                )
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors",
                diet.includes(option)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-secondary",
              )}
            >
              {diet.includes(option) && <Check className="size-3.5" />}
              {option}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-1.5">
          <Label htmlFor="allergy-list">Allergies</Label>
          <Input
            id="allergy-list"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="peanuts, shellfish"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold">Daily macro targets</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {(
            [
              ["calories", "Calories"],
              ["protein", "Protein (g)"],
              ["carbs", "Carbs (g)"],
              ["fat", "Fat (g)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`t-${key}`}>{label}</Label>
              <Input
                id={`t-${key}`}
                type="number"
                min={0}
                value={targets[key]}
                onChange={(e) => setTargets({ ...targets, [key]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold">Cooking skill</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {SKILL_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setSkill(level.value)}
              className={cn(
                "rounded-2xl border border-border p-4 text-left transition-colors",
                skill === level.value ? "border-primary bg-accent" : "hover:bg-secondary",
              )}
            >
              <p className="font-semibold">{level.label}</p>
              <p className="text-xs text-muted-foreground">{level.hint}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold">Subscription</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={cn(
                "rounded-2xl border border-border p-5",
                tier === t.id && "border-primary bg-accent/60",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{t.name}</p>
                <p className="font-display text-lg">{t.price}</p>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary" /> {p}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                variant={tier === t.id ? "outline" : "default"}
                disabled={tier === t.id || saving}
                onClick={() => {
                  setTier(t.id);
                  void save(t.id);
                }}
              >
                {tier === t.id ? "Current plan" : (
                  <>
                    <Sparkles className="size-4" /> Switch to {t.name}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end pb-4">
        <Button size="lg" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
