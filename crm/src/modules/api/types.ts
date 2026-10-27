import type { ApiContext } from "@/core/api/auth";

export type ListParams = { page: number; limit: number; q?: string; updatedSince?: Date; filters: Record<string, string | undefined> };
export type Body = Record<string, unknown>;

export interface ApiResource {
  /** keys accepted as simple equality filters on list endpoints */
  filterKeys?: string[];
  list?(ctx: ApiContext, p: ListParams): Promise<{ data: unknown[]; total: number }>;
  get?(ctx: ApiContext, id: string): Promise<unknown | null>;
  create?(ctx: ApiContext, body: Body): Promise<unknown>;
  update?(ctx: ApiContext, id: string, body: Body): Promise<unknown | null>;
  remove?(ctx: ApiContext, id: string): Promise<boolean>;
}
