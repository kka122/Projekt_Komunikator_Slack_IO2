import {QueryClient} from "@tanstack/react-query";

/**
 * Shared react-query client for the whole app (passed to `QueryClientProvider`
 * in `main.tsx`).
 *
 * Defaults: retries off so a dead API fails fast and screens can render their
 * error state instead of stalling; no refetch on window focus; queries stay
 * fresh for 30s before they become eligible for background refetch.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});

export default queryClient;
