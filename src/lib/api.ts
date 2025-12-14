const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
