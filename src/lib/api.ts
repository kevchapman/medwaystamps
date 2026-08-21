import type { Stamp, StampListResponse, StampSearchParams } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

export function listStamps(params: StampSearchParams = {}): Promise<StampListResponse> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return request<StampListResponse>(`/api/stamps${qs ? `?${qs}` : ""}`);
}

export function getStamp(id: string): Promise<Stamp> {
  return request<Stamp>(`/api/stamps/${id}`);
}

export interface CheckoutLine {
  stampId: string;
  quantity: number;
}

export function createCheckoutSession(
  lines: CheckoutLine[],
): Promise<{ url: string }> {
  return request<{ url: string }>("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ lines }),
  });
}
