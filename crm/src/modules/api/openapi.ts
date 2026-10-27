import { WEBHOOK_EVENTS } from "@/core/webhooks";

const idParam = { name: "id", in: "path", required: true, schema: { type: "string" } };
const listParams = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
  { name: "q", in: "query", description: "Text search", schema: { type: "string" } },
  { name: "updated_since", in: "query", description: "ISO 8601 timestamp; only records changed since then", schema: { type: "string", format: "date-time" } },
];
const ref = (n: string) => ({ $ref: `#/components/schemas/${n}` });
const err = (description: string) => ({ description, content: { "application/json": { schema: ref("Error") } } });
const ok = (schema: object, description = "OK") => ({ description, content: { "application/json": { schema } } });
const data = (n: string) => ({ type: "object", properties: { data: ref(n) } });
const list = (n: string) => ({ type: "object", properties: { data: { type: "array", items: ref(n) }, meta: ref("Meta") } });

function crud(tag: string, path: string, schema: string, filters: string[], writable: boolean) {
  const f = filters.map((name) => ({ name, in: "query", schema: { type: "string" } }));
  const paths: Record<string, unknown> = {
    [`/${path}`]: {
      get: { tags: [tag], summary: `List ${path}`, parameters: [...listParams, ...f], responses: { 200: ok(list(schema)), 401: err("Unauthorized"), 429: err("Rate limited") } },
      ...(writable ? { post: { tags: [tag], summary: `Create a ${tag.toLowerCase()}`, requestBody: { required: true, content: { "application/json": { schema: ref(`${schema}Input`) } } }, responses: { 201: ok(data(schema), "Created"), 403: err("Forbidden / read-only key"), 422: err("Validation failed") } } } : {}),
    },
    [`/${path}/{id}`]: {
      get: { tags: [tag], summary: `Get a ${tag.toLowerCase()}`, parameters: [idParam], responses: { 200: ok(data(schema)), 404: err("Not found") } },
      ...(writable
        ? {
            patch: { tags: [tag], summary: `Update a ${tag.toLowerCase()} (only the fields you send change)`, parameters: [idParam], requestBody: { required: true, content: { "application/json": { schema: ref(`${schema}Input`) } } }, responses: { 200: ok(data(schema)), 404: err("Not found"), 422: err("Validation failed") } },
            delete: { tags: [tag], summary: `Delete a ${tag.toLowerCase()}`, parameters: [idParam], responses: { 204: { description: "Deleted" }, 404: err("Not found") } },
          }
        : {}),
    },
  };
  return paths;
}

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "object", properties, ...(required.length ? { required } : {}) });
const str = { type: "string" };
const nstr = { type: "string", nullable: true };
const custom = { type: "object", additionalProperties: true, description: "Custom fields: key → value (see Settings → Custom fields)" };

export function buildOpenApi(origin: string) {
  return {
    openapi: "3.0.3",
    info: {
      title: "CRM API",
      version: "1.0.0",
      description:
        "REST API for the CRM. Authenticate with `Authorization: Bearer <API key>`. A key acts as its user: it sees and may change only what that user can, and a READ key cannot modify data. Money is SAR. Limit: 120 requests/minute per key.\n\n**Webhooks** (configured in Settings → API & webhooks) POST a JSON event to your URL with header `X-CRM-Signature: t=<unix>,v1=<hex>`, where `v1 = HMAC_SHA256(secret, t + '.' + rawBody)`. Reject requests whose timestamp is more than 5 minutes old. Events: " + WEBHOOK_EVENTS.join(", ") + ".",
    },
    servers: [{ url: `${origin}/api/v1` }],
    security: [{ bearer: [] }],
    tags: ["Contacts", "Companies", "Deals", "Tasks", "Quotes", "Invoices"].map((name) => ({ name })),
    paths: {
      "/me": { get: { summary: "The user and scope this key acts as", responses: { 200: ok({ type: "object" }) } } },
      "/stages": { get: { summary: "Pipeline stages", responses: { 200: ok({ type: "object" }) } } },
      ...crud("Contacts", "contacts", "Contact", ["companyId", "ownerId", "source"], true),
      ...crud("Companies", "companies", "Company", ["ownerId", "industry"], true),
      ...crud("Deals", "deals", "Deal", ["stageId", "ownerId", "companyId", "contactId"], true),
      ...crud("Tasks", "tasks", "Task", ["assigneeId", "type", "contactId", "companyId", "dealId", "completed"], true),
      ...crud("Quotes", "quotes", "Quote", ["status", "companyId", "dealId"], false),
      ...crud("Invoices", "invoices", "Invoice", ["status", "companyId", "dealId"], false),
    },
    components: {
      securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
      schemas: {
        Error: obj({ error: obj({ code: str, message: str, fields: { type: "object", additionalProperties: str } }) }),
        Meta: obj({ page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, pages: { type: "integer" } }),
        Contact: obj({ id: str, firstName: str, lastName: str, email: nstr, phone: nstr, jobTitle: nstr, source: nstr, companyId: nstr, ownerId: str, custom, createdAt: str, updatedAt: str }),
        ContactInput: obj({ firstName: str, lastName: str, email: str, phone: str, jobTitle: str, source: str, companyId: str, ownerId: { ...str, description: "Admin/Manager keys only; others are always the key's user" }, custom }, ["firstName", "lastName"]),
        Company: obj({ id: str, name: str, industry: nstr, website: nstr, phone: nstr, address: nstr, ownerId: str, custom, createdAt: str, updatedAt: str }),
        CompanyInput: obj({ name: str, industry: str, website: str, phone: str, address: str, ownerId: str, custom }, ["name"]),
        Deal: obj({ id: str, title: str, value: { type: "number" }, currency: { type: "string", example: "SAR" }, stageId: str, expectedCloseDate: nstr, companyId: nstr, contactId: nstr, ownerId: str, custom, createdAt: str, updatedAt: str }),
        DealInput: obj({ title: str, value: { type: "number" }, stageId: str, expectedCloseDate: { type: "string", format: "date" }, companyId: str, contactId: str, ownerId: str, custom }, ["title", "value", "stageId"]),
        Task: obj({ id: str, type: { type: "string", enum: ["CALL", "MEETING", "NOTE", "FOLLOW_UP"] }, subject: str, body: nstr, dueAt: nstr, completed: { type: "boolean" }, completedAt: nstr, assigneeId: str, contactId: nstr, companyId: nstr, dealId: nstr, createdAt: str, updatedAt: str }),
        TaskInput: obj({ type: { type: "string", enum: ["CALL", "MEETING", "NOTE", "FOLLOW_UP"] }, subject: str, body: str, dueAt: { type: "string", format: "date-time" }, completed: { type: "boolean" }, assigneeId: str, contactId: str, companyId: str, dealId: str }, ["type", "subject"]),
        Line: obj({ description: str, qty: { type: "number" }, unitPrice: { type: "number" }, discountPct: { type: "number" }, vatRate: { type: "number" } }),
        Quote: obj({ id: str, number: str, status: str, issueDate: str, validUntil: nstr, companyId: nstr, contactId: nstr, dealId: nstr, ownerId: str, currency: str, lines: { type: "array", items: ref("Line") }, subtotal: { type: "number" }, vat: { type: "number" }, total: { type: "number" }, createdAt: str, updatedAt: str }),
        Invoice: obj({ id: str, number: nstr, uuid: str, status: str, issueDate: str, dueDate: nstr, issuedAt: nstr, paidAt: nstr, buyer: obj({ name: str, vatNumber: nstr, address: nstr }), companyId: nstr, contactId: nstr, dealId: nstr, quoteId: nstr, ownerId: str, currency: str, lines: { type: "array", items: ref("Line") }, subtotal: { type: "number" }, vat: { type: "number" }, total: { type: "number" }, createdAt: str, updatedAt: str }),
      },
    },
  };
}
