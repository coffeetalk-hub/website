import { authenticate, asApiError } from "@/core/api/auth";
import { errorResponse, json } from "@/core/api/errors";
import { db } from "@/core/db";

export async function GET(req: Request) {
  try {
    await authenticate(req);
    const stages = await db.stage.findMany({ orderBy: { position: "asc" } });
    return json({ data: stages.map((s) => ({ id: s.id, name: s.name, position: s.position, probability: s.probability, kind: s.kind })) });
  } catch (e) {
    return errorResponse(asApiError(e));
  }
}
