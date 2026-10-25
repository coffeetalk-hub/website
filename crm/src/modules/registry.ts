import { LayoutDashboard, Users, Building2, Handshake, CheckSquare, UserCog, Settings, ArrowLeftRight, type LucideIcon } from "lucide-react";
import type { Resource, SessionUser } from "@/core/permissions";
import { can } from "@/core/permissions";
import { t } from "@/core/i18n";

/**
 * Module manifest. To add a module: create src/modules/<name>/, add an entry here,
 * and add its route under src/app/(app)/<route>. The sidebar and access checks read from this list.
 */
export type ModuleManifest = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Resource whose permission gates the nav entry (server pages must still check). */
  resource?: Resource;
};

export const modules: ModuleManifest[] = [
  { key: "dashboard", label: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
  { key: "contacts", label: t.nav.contacts, href: "/contacts", icon: Users, resource: "contact" },
  { key: "companies", label: t.nav.companies, href: "/companies", icon: Building2, resource: "company" },
  { key: "deals", label: t.nav.deals, href: "/deals", icon: Handshake, resource: "deal" },
  { key: "tasks", label: t.nav.tasks, href: "/tasks", icon: CheckSquare, resource: "activity" },
  { key: "import-export", label: t.nav.importExport, href: "/import-export", icon: ArrowLeftRight, resource: "import" },
  { key: "users", label: t.nav.users, href: "/users", icon: UserCog, resource: "user" },
  { key: "settings", label: t.nav.settings, href: "/settings", icon: Settings, resource: "settings" },
];

export function modulesFor(user: SessionUser) {
  return modules.filter((m) => !m.resource || can(user, m.resource));
}
