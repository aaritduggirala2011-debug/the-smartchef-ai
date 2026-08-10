import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pantry")({
  head: () => ({
    meta: [
      { title: "Your pantry — Smart Chef" },
      { name: "description", content: "Add the ingredients you have on hand so Smart Chef can match recipes to them." },
      { property: "og:title", content: "Your pantry — Smart Chef" },
      { property: "og:description", content: "Track the ingredients in your kitchen." },
    ],
  }),
  component: Pantry,
});

const QUICK_ADD = [
  "Eggs", "Chicken breast", "Rice", "Olive oil", "Onion", "Garlic", "Tomatoes",
  "Spinach", "Greek yogurt", "Black beans", "Pasta", "Cheddar", "Tofu", "Salmon",
  "Sweet potato", "Oats", "Broccoli", "Lemon",
];

function Pantry() {
  const qc = useQueryClient();
  const [value, setValue] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["pantry"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pantry_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async (name: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("pantry_items").insert({ name, user_id: uid });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantry"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pantry_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantry"] }),
  });

  const existing = new Set(items.map((i) => i.name.toLowerCase()));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    if (existing.has(name.toLowerCase())) {
      toast.info("Already in your pantry");
      setValue("");
      return;
    }
    add.mutate(name);
    setValue("");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">What's in your kitchen?</h1>
      <p className="mt-2 text-muted-foreground">
        Add whatever you have on hand — Smart Chef builds recipes around it.
      </p>

      <form onSubmit={submit} className="mt-6 flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. chickpeas"
          className="h-12 rounded-2xl"
        />
        <Button type="submit" size="lg" className="rounded-2xl">
          <Plus className="size-4" /> Add
        </Button>
      </form>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold">Your ingredients ({items.length})</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing yet. Add a few staples below to get started.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              >
                {item.name}
                <button
                  onClick={() => remove.mutate(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="text-accent-foreground/60 hover:text-accent-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Quick add</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ADD.filter((q) => !existing.has(q.toLowerCase())).map((q) => (
            <button
              key={q}
              onClick={() => add.mutate(q)}
              className="rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:bg-secondary"
            >
              + {q}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button asChild size="lg" disabled={items.length === 0}>
          <Link to="/recipes">
            <Sparkles className="size-4" /> Find recipes
          </Link>
        </Button>
      </div>
    </div>
  );
}
