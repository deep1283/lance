import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const usePrefetch = () => {
  const router = useRouter();

  const prefetchRoute = useCallback(
    (route: string) => {
      // Prefetch the route in the background
      router.prefetch(route);
    },
    [router]
  );

  const prefetchCompetitor = useCallback(
    (competitorId: string) => {
      prefetchRoute(`/dashboard/competitors/${competitorId}`);
    },
    [prefetchRoute]
  );

  const prefetchDashboard = useCallback(() => {
    prefetchRoute("/dashboard");
  }, [prefetchRoute]);

  return {
    prefetchRoute,
    prefetchCompetitor,
    prefetchDashboard,
  };
};
