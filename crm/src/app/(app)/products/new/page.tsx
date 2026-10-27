import { requireAccess } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { createProduct } from "@/modules/products/actions";
import { ProductForm } from "@/modules/products/components/product-form";
import { getCompanyProfile } from "@/modules/billing/profile";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewProductPage() {
  const t = await getT();
  await requireAccess("product", "create");
  const profile = await getCompanyProfile();
  return (
    <>
      <PageHeader title={t.products.new} />
      <Card className="max-w-3xl">
        <CardContent className="pt-5">
          <ProductForm action={createProduct} defaultVat={profile.defaultVatRate} />
        </CardContent>
      </Card>
    </>
  );
}
