import { authenticate, asApiError } from "@/core/api/auth";
import { errorResponse, json } from "@/core/api/errors";

export async function GET(req: Request) {
  try {
    const ctx = await authenticate(req);
    return json({ data: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, role: ctx.user.role, scope: ctx.scope } });
  } catch (e) {
    return errorResponse(asApiError(e));
  }
}
