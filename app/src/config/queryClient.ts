import {QueryClient} from "@tanstack/react-query";

// Backend is not wired up yet; keep retries off so a dead API fails fast
// instead of stalling the UI, and let screens render their error state.
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
