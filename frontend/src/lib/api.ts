export function getApiBaseUrl(): string {
  // If an explicit backend URL is provided in env (e.g. Railway or Vercel environment), use it
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // In browser on local machine, direct to local FastAPI port 8000
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
    // In production without env, use relative path (delegated to Next.js rewrites)
    return "";
  }

  return "";
}

export async function safeFetchJson<T = any>(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let data: any = null;
    let isHtml = false;

    if (text.trim().startsWith("<") || text.includes("<!DOCTYPE") || text.includes("<html")) {
      isHtml = true;
    }

    if (!isHtml) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text };
      }
    } else {
      data = {
        detail: `Backend error (${res.status} ${res.statusText}). The request reached a page returning HTML instead of JSON. Ensure your Railway backend URL is set in Vercel as NEXT_PUBLIC_API_URL.`,
      };
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
        "Network connection failed. Please check if your backend service is running and accessible.",
    };
  }
}
