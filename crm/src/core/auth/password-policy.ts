// Small, dependency-free password rules. Messages are looked up in the dictionary (t.errors[key]).
const COMMON = new Set([
  "password", "password1", "password12", "password123", "password1234", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop",
  "letmein123", "admin123", "admin1234", "welcome123", "iloveyou1", "abc12345", "changeme", "changeme123", "11111111", "00000000",
]);

export type PasswordProblem = "minPassword" | "passwordCommon" | "passwordContainsEmail";

export function passwordProblem(pw: string, ctx: { email?: string } = {}): PasswordProblem | null {
  if (pw.length < 8) return "minPassword";
  if (COMMON.has(pw.toLowerCase())) return "passwordCommon";
  const local = ctx.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && pw.toLowerCase().includes(local)) return "passwordContainsEmail";
  return null;
}
