import { getT } from "@/core/i18n/server";
import { Download } from "lucide-react";
import { requireAccess } from "@/core/auth/session";
import { can } from "@/core/permissions";
import { getFieldDefs } from "@/core/custom-fields";
import { fieldsFor } from "@/modules/import-export/fields";
import { Importer } from "@/modules/import-export/components/importer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ImportExportPage() {
  const t = await getT();
  const user = await requireAccess("import");
  const [contactDefs, companyDefs] = await Promise.all([getFieldDefs("CONTACT"), getFieldDefs("COMPANY")]);
  const links = [
    { label: t.nav.contacts, href: "/api/export/contacts" },
    { label: t.nav.companies, href: "/api/export/companies" },
  ];
  return (
    <>
      <PageHeader title={t.importExport.title} />
      <div className="space-y-4">
        {can(user, "export") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.importExport.exportTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">{t.importExport.exportHelp}</p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {links.map((l) => (
                <Button key={l.href} variant="outline" asChild>
                  <a href={l.href} download>
                    <Download className="h-4 w-4" />
                    {l.label}
                  </a>
                </Button>
              ))}
              <Button variant="ghost" asChild>
                <a href="/api/export/contacts?template=1" download>
                  {t.importExport.contactsTemplate}
                </a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="/api/export/companies?template=1" download>
                  {t.importExport.companiesTemplate}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
        <Importer fieldsByEntity={{ CONTACT: fieldsFor("CONTACT", contactDefs, t), COMPANY: fieldsFor("COMPANY", companyDefs, t) }} />
      </div>
    </>
  );
}
