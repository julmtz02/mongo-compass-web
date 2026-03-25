interface ApiOptions {
  method?: string;
  body?: Record<string, unknown>;
  csrfToken?: string;
}

interface ApiResponse<T = any> {
  ok: boolean;
  data: T;
  status: number;
}

export async function api<T = any>(url: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.csrfToken) {
    headers['csrf-token'] = options.csrfToken;
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  return { ok: res.ok, data, status: res.status };
}
