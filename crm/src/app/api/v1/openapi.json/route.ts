import { buildOpenApi } from "@/modules/api/openapi";

// Public: the spec describes the API, it contains no data.
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return new Response(JSON.stringify(buildOpenApi(origin), null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
