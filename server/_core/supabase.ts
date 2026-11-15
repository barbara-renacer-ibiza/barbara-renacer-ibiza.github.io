export function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

export async function supabaseFetch(path: string, init: RequestInit = {}) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured");
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Authorization", `Bearer ${config.key}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${config.url}${path}`, { ...init, headers });
}

export async function checkSupabaseConnection() {
  const config = getSupabaseConfig();
  if (!config) return { configured: false, reachable: false, projectUrl: null as string | null };
  try {
    const response = await supabaseFetch("/rest/v1/", { method: "GET" });
    return { configured: true, reachable: response.ok, projectUrl: config.url, status: response.status };
  } catch {
    return { configured: true, reachable: false, projectUrl: config.url };
  }
}
