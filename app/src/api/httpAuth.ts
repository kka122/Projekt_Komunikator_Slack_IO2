import axios, {type InternalAxiosRequestConfig} from "axios";

// The backend (flask_jwt_extended) runs with JWT_COOKIE_CSRF_PROTECT enabled.
// For every state-changing request it expects the value of the non-httpOnly
// `csrf_access_token` cookie echoed back in an `X-CSRF-TOKEN` header (and the
// `csrf_refresh_token` cookie for the refresh endpoint). The auth cookies
// themselves are httpOnly and ride along automatically via withCredentials.

const CSRF_METHODS = new Set(["post", "put", "patch", "delete"]);

interface RetriableConfig extends InternalAxiosRequestConfig {
  _csrfRetry?: boolean;
}

function readCookie(name: string): string | null {
  const escaped = name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
  const match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

let refreshing: Promise<unknown> | null = null;

export function setupAuthInterceptors(): void {
  axios.interceptors.request.use((config) => {
    const method = (config.method ?? "get").toLowerCase();
    if (CSRF_METHODS.has(method)) {
      const isRefresh = (config.url ?? "").includes("/auth/refresh");
      const token = readCookie(isRefresh ? "csrf_refresh_token" : "csrf_access_token");
      if (token) config.headers.set("X-CSRF-TOKEN", token);
    }
    return config;
  });

  // On a 401 (typically an expired 15-minute access token) try the refresh
  // token once, then replay the original request. Concurrent 401s share a
  // single in-flight refresh.
  axios.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
        const config = error.config as RetriableConfig;
        const url = config.url ?? "";
        const isAuthRoute =
          url.includes("/auth/refresh") ||
          url.includes("/auth/login") ||
          url.includes("/auth/google");

        if (!config._csrfRetry && !isAuthRoute) {
          config._csrfRetry = true;
          try {
            if (!refreshing) {
              refreshing = axios.post("/auth/refresh").finally(() => {
                refreshing = null;
              });
            }
            await refreshing;
            return axios(config);
          } catch {
            // Refresh failed — surface the original 401 so guards can redirect.
          }
        }
      }
      return Promise.reject(error);
    },
  );
}