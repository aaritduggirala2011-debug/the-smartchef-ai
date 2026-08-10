import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    enabled: !!session,
    queryFn: async () => (await supabase.from("profiles").select("*").maybeSingle()).data,
  });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (profile && !profile.onboarded && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, pathname, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ChefHat className="size-8 animate-pulse text-primary" />
      </div>
    );
  }

  return <AppShell />;
}


