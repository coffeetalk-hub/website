import { requireUser } from "@/core/auth/session";
import { PageHeader } from "@/components/page-header";
import { t } from "@/core/i18n";

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title={t.dashboard.title} />
      <p className="text-muted-foreground">Welcome, {user.name}.</p>
    </>
  );
}
