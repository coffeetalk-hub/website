import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { t } from "@/core/i18n";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-xl font-semibold text-foreground">{t.auth.signInTitle}</h1>
        </CardHeader>
        <CardContent className="pt-4">
          <LoginForm />
          <p className="mt-4 text-xs text-muted-foreground">Demo: admin@demo.com / password123</p>
        </CardContent>
      </Card>
    </main>
  );
}
