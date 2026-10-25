import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/core/i18n/client";
import { getDirection } from "@/core/i18n";
import { getLocale } from "@/core/i18n/server";
import "./globals.css";

// Self-hosted at build time; only used when the page is RTL (see globals.css).
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = { title: "CRM", description: "Customer relationship management" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={getDirection(locale)} suppressHydrationWarning>
      <body className={arabic.variable}>
        <I18nProvider locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
