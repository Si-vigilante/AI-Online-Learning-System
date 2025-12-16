export async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text || text.trim().length === 0) {
    throw new Error(`Empty response body. status=${res.status}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Invalid JSON from server. status=${res.status}. body=${text.slice(0, 300)}`);
  }
}
