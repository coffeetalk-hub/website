import { notFound } from "next/navigation";
import { db } from "@/core/db";
import { requireAccess } from "@/core/auth/session";
import { getT } from "@/core/i18n/server";
import { deleteProduct, updateProduct } from "@/modules/products/actions";
import { ProductForm } from "@/modules/products/components/product-form";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/forms/delete-button";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  await requireAccess("product", "update");
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();
  return (
    <>
      <PageHeader title={`${t.common.edit}: ${product.name}`}>
        <DeleteButton action={deleteProduct.bind(null, id)} />
      </PageHeader>
      <Card className="max-w-3xl">
        <CardContent className="pt-5">
          <ProductForm action={updateProduct.bind(null, id)} initial={product} />
        </CardContent>
      </Card>
    </>
  );
}
