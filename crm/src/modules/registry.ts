import { LayoutDashboard, Users, Building2, Handshake, CheckSquare, UserCog, Settings, ArrowLeftRight, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/core/i18n/en";
import type { Resource, SessionUser } from "@/core/permissions";
import { can } from "@/core/permissions";

/**
 * Module manifest. To add a module: create src/modules/<name>/, add an entry here,
 * and add its route under src/app/(app)/<route>. The sidebar and access checks read from this list.
 */
export type ModuleManifest = {
  key: string;
  /** Key into the dictionary's `nav` section. */
  labelKey: keyof Dictionary["nav"];
  href: string;
  icon: LucideIcon;
  /** Resource whose permission gates the nav entry (server pages must still check). */
  resource?: Resource;
};

export const modules: ModuleManifest[] = [
  { key: "dashboard", labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "contacts", labelKey: "contacts", href: "/contacts", icon: Users, resource: "contact" },
  { key: "companies", labelKey: "companies", href: "/companies", icon: Building2, resource: "company" },
  { key: "deals", labelKey: "deals", href: "/deals", icon: Handshake, resource: "deal" },
  { key: "tasks", labelKey: "tasks", href: "/tasks", icon: CheckSquare, resource: "activity" },
  { key: "import-export", labelKey: "importExport", href: "/import-export", icon: ArrowLeftRight, resource: "import" },
  { key: "users", labelKey: "users", href: "/users", icon: UserCog, resource: "user" },
  { key: "settings", labelKey: "settings", href: "/settings", icon: Settings, resource: "settings" },
];

export function modulesFor(user: SessionUser) {
  return modules.filter((m) => !m.resource || can(user, m.resource));
}
