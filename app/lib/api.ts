import type { Admin, Stamp, StampImage, StampInput, StampListResponse, StampSearchParams } from "../types";

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

// ---- Admin -----------------------------------------------------------

export function adminLogin(email: string, password: string): Promise<Admin> {
  return request<Admin>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function adminLogout(): Promise<{ ok: true }> {
  return request<{ ok: true }>("/api/admin/logout", { method: "POST" });
}

export function getAdminMe(): Promise<Admin> {
  return request<Admin>("/api/admin/me");
}

export function createStamp(input: StampInput): Promise<Stamp> {
  return request<Stamp>("/api/admin/stamps", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStamp(id: string, input: Partial<StampInput>): Promise<Stamp> {
  return request<Stamp>(`/api/admin/stamps/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// Bypasses the request<T>() wrapper deliberately — it forces a
// Content-Type: application/json header, which would break the browser's
// own multipart boundary header for a FormData body.
export async function uploadStampImage(
  stampId: string,
  file: File,
  altText?: string,
): Promise<StampImage> {
  const form = new FormData();
  form.set("image", file);
  if (altText) form.set("altText", altText);

  const res = await fetch(`/api/admin/stamps/${stampId}/images`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Image upload failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<StampImage>;
}

export function deleteStampImage(imageId: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/api/admin/images/${imageId}`, { method: "DELETE" });
}
