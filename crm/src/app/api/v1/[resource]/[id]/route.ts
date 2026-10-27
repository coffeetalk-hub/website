import { deleteHandler, getHandler, updateHandler } from "@/modules/api/handler";

type Ctx = { params: Promise<{ resource: string; id: string }> };
export const GET = (req: Request, { params }: Ctx) => getHandler(req, params);
export const PATCH = (req: Request, { params }: Ctx) => updateHandler(req, params);
export const DELETE = (req: Request, { params }: Ctx) => deleteHandler(req, params);
