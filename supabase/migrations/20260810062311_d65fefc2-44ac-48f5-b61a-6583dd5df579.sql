CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  diet_restrictions text[] NOT NULL DEFAULT '{}',
  allergies text[] NOT NULL DEFAULT '{}',
  calorie_target integer NOT NULL DEFAULT 2000,
  protein_target integer NOT NULL DEFAULT 150,
  carbs_target integer NOT NULL DEFAULT 200,
  fat_target integer NOT NULL DEFAULT 65,
  skill_level text NOT NULL DEFAULT 'beginner',
  subscription_tier text NOT NULL DEFAULT 'free',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.pantry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pantry_items TO authenticated;
GRANT ALL ON public.pantry_items TO service_role;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pantry" ON public.pantry_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX pantry_items_user_idx ON public.pantry_items(user_id);

CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'easy',
  minutes integer NOT NULL DEFAULT 30,
  servings integer NOT NULL DEFAULT 1,
  calories integer NOT NULL DEFAULT 0,
  protein integer NOT NULL DEFAULT 0,
  carbs integer NOT NULL DEFAULT 0,
  fat integer NOT NULL DEFAULT 0,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  substitutions jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recipes" ON public.recipes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX recipes_user_idx ON public.recipes(user_id, created_at DESC);

CREATE TABLE public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  title text NOT NULL,
  servings numeric NOT NULL DEFAULT 1,
  calories integer NOT NULL DEFAULT 0,
  protein integer NOT NULL DEFAULT 0,
  carbs integer NOT NULL DEFAULT 0,
  fat integer NOT NULL DEFAULT 0,
  logged_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_logs TO authenticated;
GRANT ALL ON public.meal_logs TO service_role;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal logs" ON public.meal_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX meal_logs_user_idx ON public.meal_logs(user_id, logged_at DESC);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();