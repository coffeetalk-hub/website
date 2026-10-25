import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { getDirection, defaultLocale } from "@/core/i18n";
import "./globals.css";

export const metadata: Metadata = { title: "CRM", description: "Customer relationship management" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Locale hook: when Arabic is added, read the locale from a cookie here.
  const locale = defaultLocale;
  return (
    <html lang={locale} dir={getDirection(locale)} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
