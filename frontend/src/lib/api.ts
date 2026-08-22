export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
}

export async function safeFetchJson<T = any>(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text || `HTTP ${res.status} ${res.statusText}` };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: data as T,
        error:
          data?.detail ||
          data?.error ||
          `Request failed with status ${res.status} (${res.statusText})`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: data as T,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null as unknown as T,
      error:
        err?.message ||
        "Network connection failed. Please ensure the backend server is running on http://127.0.0.1:8000.",
    };
  }
}
