import { NextResponse, type NextRequest } from "next/server";

// HTTP Basic Auth on every request. Triggers the browser's native password
// dialog (the same one you get from any .htpasswd-protected site). Username
// is ignored — only the password is checked.
//
// Default password: "oliveapp.com". Override by setting SITE_PASSWORD in
// .env.local (don't expose it via NEXT_PUBLIC_*).
//
// In Next.js 16 the file used to be `middleware.ts`; it's now `proxy.ts`
// with the same semantics. The matcher excludes Next.js static assets so
// CSS/JS/images/fonts load without a credential prompt loop.
const PASSWORD = process.env.SITE_PASSWORD ?? "oliveapp.com";

const REALM = "Olive Quiz Studio";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

export function proxy(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(auth.slice("Basic ".length));
  } catch {
    return unauthorized();
  }

  // "username:password" — username is ignored, only the password matters.
  const sep = decoded.indexOf(":");
  if (sep < 0) return unauthorized();
  const supplied = decoded.slice(sep + 1);

  if (supplied !== PASSWORD) return unauthorized();
  return NextResponse.next();
}

export const config = {
  // Run on every route EXCEPT Next.js's own static asset paths so CSS/JS/
  // fonts/images don't each trigger a separate auth prompt.
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon\\.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.webp$|.*\\.ico$).*)",
  ],
};
