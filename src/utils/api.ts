// Requests are proxied through the Vite dev server to avoid cert issues.
// The proxy target is configured in vite.config.ts using VITE_API_HOST / VITE_API_PORT.
export const API_BASE = "/v1";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("token");
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `token ${token}` } : {}),
      ...options.headers,
    },
  });
}
