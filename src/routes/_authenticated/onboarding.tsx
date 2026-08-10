import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIET_OPTIONS, SKILL_LEVELS } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your goals — Smart Chef" },
      { name: "description", content: "Tell Smart Chef about your diet, macro targets and cooking skill level." },
      { property: "og:title", content: "Set up your goals — Smart Chef" },
      { property: "og:description", content: "Personalise recipe matching in three quick steps." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [diet, setDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [targets, setTargets] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [skill, setSkill] = useState("beginner");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!profile) return;
    setDiet(profile.diet_restrictions ?? []);
    setAllergies((profile.allergies ?? []).join(", "));
    setSkill(profile.skill_level);
    setTargets({
      calories: profile.calorie_target,
      protein: profile.protein_target,
      carbs: profile.carbs_target,
      fat: profile.fat_target,
    });
  }, [profile]);

  function toggleDiet(value: string) {
    setDiet((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  }

  async function finish() {
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
      onboarded: true,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("You're all set!");
    navigate({ to: "/pantry" });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-terracotta">Step {step + 1} of 3</p>
      <div className="mt-3 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("h-1.5 flex-1 rounded-full bg-secondary", i <= step && "bg-primary")}
          />
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-semibold">Any dietary needs?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll never suggest a recipe that breaks these rules.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {DIET_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleDiet(option)}
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
            <div className="mt-6 space-y-1.5">
              <Label htmlFor="allergies">Allergies (comma separated)</Label>
              <Input
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="peanuts, shellfish"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold">Your daily targets</h1>
            <p className="mt-1 text-sm text-muted-foreground">You can fine-tune these any time.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["calories", "Calories (kcal)"],
                  ["protein", "Protein (g)"],
                  ["carbs", "Carbs (g)"],
                  ["fat", "Fat (g)"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    value={targets[key]}
                    onChange={(e) => setTargets({ ...targets, [key]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold">How confident are you cooking?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Recipes get matched to your comfort level.
            </p>
            <div className="mt-5 space-y-3">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setSkill(level.value)}
                  className={cn(
                    "w-full rounded-2xl border border-border p-4 text-left transition-colors",
                    skill === level.value ? "border-primary bg-accent" : "hover:bg-secondary",
                  )}
                >
                  <p className="font-semibold">{level.label}</p>
                  <p className="text-sm text-muted-foreground">{level.hint}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between gap-3">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
          ) : (
            <Button onClick={finish} disabled={saving}>
              {saving ? "Saving…" : "Finish setup"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
