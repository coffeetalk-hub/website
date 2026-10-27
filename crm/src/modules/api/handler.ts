import { authenticate, asApiError } from "@/core/api/auth";
import { ApiError, errorResponse, json } from "@/core/api/errors";
import { RESOURCES } from "./resources";
import { parseListParams, readJson } from "./helpers";
import type { ApiResource } from "./types";

type Params = Promise<{ resource: string; id?: string }>;

async function run(req: Request, params: Params, fn: (r: ApiResource, ctx: Awaited<ReturnType<typeof authenticate>>, id?: string) => Promise<Response>) {
  try {
    const ctx = await authenticate(req);
    const { resource, id } = await params;
    const r = RESOURCES[resource];
    if (!r) throw new ApiError(404, "not_found", `Unknown resource '${resource}'.`);
    return await fn(r, ctx, id);
  } catch (e) {
    return errorResponse(asApiError(e));
  }
}

const methodNotAllowed = () => new ApiError(405, "method_not_allowed", "This resource does not support that method.");
const notFound = () => new ApiError(404, "not_found", "Record not found.");

export const listHandler = (req: Request, params: Params) =>
  run(req, params, async (r, ctx) => {
    if (!r.list) throw methodNotAllowed();
    const p = parseListParams(new URL(req.url), r.filterKeys);
    const { data, total } = await r.list(ctx, p);
    return json({ data, meta: { page: p.page, limit: p.limit, total, pages: Math.max(1, Math.ceil(total / p.limit)) } });
  });

export const createHandler = (req: Request, params: Params) =>
  run(req, params, async (r, ctx) => {
    if (!r.create) throw methodNotAllowed();
    return json({ data: await r.create(ctx, await readJson(req)) }, 201);
  });

export const getHandler = (req: Request, params: Params) =>
  run(req, params, async (r, ctx, id) => {
    if (!r.get) throw methodNotAllowed();
    const rec = await r.get(ctx, id!);
    if (!rec) throw notFound();
    return json({ data: rec });
  });

export const updateHandler = (req: Request, params: Params) =>
  run(req, params, async (r, ctx, id) => {
    if (!r.update) throw methodNotAllowed();
    const rec = await r.update(ctx, id!, await readJson(req));
    if (!rec) throw notFound();
    return json({ data: rec });
  });

export const deleteHandler = (req: Request, params: Params) =>
  run(req, params, async (r, ctx, id) => {
    if (!r.remove) throw methodNotAllowed();
    if (!(await r.remove(ctx, id!))) throw notFound();
    return new Response(null, { status: 204 });
  });
