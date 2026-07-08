const DEFAULT_API_BASE_URL = "http://localhost:8082";

function normalizeBaseUrl(value, fallback) {
  const resolved = (value || fallback || "").trim();
  return resolved.replace(/\/$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL,
  DEFAULT_API_BASE_URL
);

export const WS_URL = normalizeBaseUrl(
  import.meta.env.VITE_WS_URL,
  "ws://localhost:8082/chat/chat"
);

export function resolveApiUrl(path) {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}