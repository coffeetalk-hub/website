import type { ApiResource } from "../types";
import { companies } from "./companies";
import { contacts } from "./contacts";
import { deals } from "./deals";
import { invoices, quotes } from "./billing";
import { tasks } from "./tasks";

/** URL name → resource. The permission resource each one needs is enforced inside (scope()/assertCan). */
export const RESOURCES: Record<string, ApiResource> = { contacts, companies, deals, tasks, quotes, invoices };
