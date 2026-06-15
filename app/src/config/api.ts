// Single source for where the backend lives. The API client talks to
// API_BASE_URL; static assets (avatars, logos, attachments) come back from the
// backend as root-relative paths (e.g. "/api/uploads/avatars/x.png") and must
// be resolved against the backend origin, not the frontend's.
export const BACKEND_ORIGIN = "http://localhost:5000";
export const API_BASE_URL = `${BACKEND_ORIGIN}/api`;

export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return "";
  // Already absolute (http(s)://, protocol-relative, data:, blob:) — leave it.
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}
