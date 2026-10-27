export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    return json({ error: { code: e.code, message: e.message, ...(e.fields ? { fields: e.fields } : {}) } }, e.status, e.status === 429 ? { "Retry-After": "30" } : {});
  }
  console.error("API error", e);
  return json({ error: { code: "internal_error", message: "Something went wrong." } }, 500);
}
