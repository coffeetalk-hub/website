import { createHandler, listHandler } from "@/modules/api/handler";

type Ctx = { params: Promise<{ resource: string }> };
export const GET = (req: Request, { params }: Ctx) => listHandler(req, params);
export const POST = (req: Request, { params }: Ctx) => createHandler(req, params);
