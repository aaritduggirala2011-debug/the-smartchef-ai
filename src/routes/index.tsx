import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChefHat, Carrot, Target, Sparkles, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-ingredients.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Chef — Recipes from your pantry, matched to your macros" },
      {
        name: "description",
        content:
          "Tell Smart Chef what's in your kitchen. Get recipes that fit your diet, cooking skill and remaining macros — then log them in one tap.",
      },
      { property: "og:title", content: "Smart Chef — Cook what you have, hit your macros" },
      {
        property: "og:description",
        content: "AI recipes built from your pantry, your diet and your daily macro targets.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Carrot,
    title: "Cook from what you have",
    body: "Add the ingredients sitting in your fridge and pantry. No extra shopping trip required.",
  },
  {
    icon: Target,
    title: "Macro-aware suggestions",
    body: "Every recipe is scored against the calories and protein you have left for the day.",
  },
  {
    icon: Sparkles,
    title: "Matched to your skill",
    body: "Beginner-friendly steps and smart substitutions so dinner never gets intimidating.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 max-w-6xl items-center px-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ChefHat className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">Smart Chef</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="surface-warm">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-terracotta/12 px-3 py-1 text-xs font-semibold tracking-wide text-terracotta uppercase">
              <Sparkles className="size-3.5" /> AI kitchen companion
            </span>
            <h1 className="mt-5 text-4xl leading-[1.05] font-semibold text-balance md:text-6xl">
              Cook what you already have — and still hit your macros.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Smart Chef turns the ingredients on your shelf into recipes that respect your
              dietary needs, your cooking confidence and the calories you have left today.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Start cooking free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Free plan includes daily recipe suggestions and macro tracking.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)]">
              <img
                src={heroImage}
                alt="Fresh ingredients laid out on a wooden table: herbs, avocado, tomatoes, chickpeas and salmon"
                width={1408}
                height={1008}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:block">
              <p className="text-xs text-muted-foreground">Protein left today</p>
              <p className="font-display text-2xl font-semibold text-primary">62 g</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-semibold">Built for real weeknights</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-[2rem] bg-primary px-8 py-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-semibold text-balance">
            Dinner sorted in about ninety seconds.
          </h2>
          <p className="mx-auto mt-3 max-w-lg opacity-90">
            Add your ingredients, set your targets, and let Smart Chef do the matching.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link to="/auth">Create your free account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Smart Chef
      </footer>
    </div>
  );
}
