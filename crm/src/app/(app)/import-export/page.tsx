import { Download } from "lucide-react";
import { requireAccess } from "@/core/auth/session";
import { can } from "@/core/permissions";
import { getFieldDefs } from "@/core/custom-fields";
import { fieldsFor } from "@/modules/import-export/fields";
import { Importer } from "@/modules/import-export/components/importer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/core/i18n";

export default async function ImportExportPage() {
  const user = await requireAccess("import");
  const [contactDefs, companyDefs] = await Promise.all([getFieldDefs("CONTACT"), getFieldDefs("COMPANY")]);
  const links = [
    { label: "Contacts", href: "/api/export/contacts" },
    { label: "Companies", href: "/api/export/companies" },
  ];
  return (
    <>
      <PageHeader title={t.importExport.title} />
      <div className="space-y-4">
        {can(user, "export") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export to CSV</CardTitle>
              <p className="text-sm text-muted-foreground">Includes custom fields. Reps export only their own records.</p>
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
                  Contacts template
                </a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="/api/export/companies?template=1" download>
                  Companies template
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
        <Importer fieldsByEntity={{ CONTACT: fieldsFor("CONTACT", contactDefs), COMPANY: fieldsFor("COMPANY", companyDefs) }} />
      </div>
    </>
  );
}
