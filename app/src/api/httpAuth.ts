import axios, {type InternalAxiosRequestConfig} from "axios";

// The backend (flask_jwt_extended) runs with JWT_COOKIE_CSRF_PROTECT enabled.
// For every state-changing request it expects the value of the non-httpOnly
// `csrf_access_token` cookie echoed back in an `X-CSRF-TOKEN` header (and the
// `csrf_refresh_token` cookie for the refresh endpoint). The auth cookies
// themselves are httpOnly and ride along automatically via withCredentials.

/** HTTP methods that mutate state and therefore require a CSRF token. */
const CSRF_METHODS = new Set(["post", "put", "patch", "delete"]);

/** axios config tagged with a one-shot retry flag to prevent refresh loops. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  /** Set once after a 401 triggers a token refresh, so we replay at most once. */
  _csrfRetry?: boolean;
}

/**
 * Read a browser cookie by name.
 *
 * @param name - Cookie name (regex-escaped before matching).
 * @returns The decoded value, or `null` if the cookie is absent.
 */
function readCookie(name: string): string | null {
  const escaped = name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
  const match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

/** In-flight refresh request shared by all concurrent 401 retries (dedupes). */
let refreshing: Promise<unknown> | null = null;

/**
 * Install the global axios auth interceptors. Call once at startup
 * (`main.tsx`).
 *
 * Request side: for state-changing methods, echo the relevant non-httpOnly CSRF
 * cookie (`csrf_refresh_token` on `/auth/refresh`, else `csrf_access_token`)
 * into the `X-CSRF-TOKEN` header — the backend runs flask_jwt_extended with
 * `JWT_COOKIE_CSRF_PROTECT`. The httpOnly auth cookies ride along automatically
 * via `withCredentials`.
 *
 * Response side: on a 401 (typically an expired 15-minute access token), attempt
 * `/auth/refresh` once and replay the original request. Concurrent 401s share a
 * single in-flight refresh; auth routes themselves are never retried.
 */
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