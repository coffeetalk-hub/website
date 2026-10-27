import { requireUser } from "@/core/auth/session";

// Chrome-free layout for printable documents. Signed-in users only; permission checks happen in each page.
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="min-h-screen bg-neutral-200 p-4 print:bg-white print:p-0">{children}</div>;
}
