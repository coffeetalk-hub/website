import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Cheap gate: signature check only. Real authorization (active user, role,
// ownership) happens server-side in every page/action via requireUser().
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("crm_session")?.value;
  const login = new URL("/login", req.url);
  const isLogin = req.nextUrl.pathname === "/login";
  let valid = false;
  if (token && process.env.SESSION_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET));
      valid = true;
    } catch {}
  }
  if (!valid && !isLogin) return NextResponse.redirect(login);
  if (valid && isLogin) return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
