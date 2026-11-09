import { NextResponse, type NextRequest } from "next/server";
import postgres from "postgres";

const contactPath = /^\/contacts\/(\d+)$/;
const SESSION_COOKIE = "better-auth.session_token";

// Open without a session: the sign-in pages, the link from the letter, and the deploy check.
const openPaths = [/^\/login(\/.*)?$/, /^\/api\/auth\//, /^\/health$/];

let sql: ReturnType<typeof postgres> | undefined;

function database() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  sql ??= postgres(connectionString, { max: 1 });
  return sql;
}

function sessionToken(request: NextRequest) {
  const raw =
    request.cookies.get(`__Secure-${SESSION_COOKIE}`)?.value ??
    request.cookies.get(SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  // The cookie is "<token>.<signature>"; the table stores the token.
  const token = raw.split(".")[0];
  return token.length > 0 ? token : null;
}

async function sessionUserId(request: NextRequest) {
  const token = sessionToken(request);

  if (!token) {
    return null;
  }

  const rows = await database()<{ user_id: string }[]>`
    select user_id from "session" where token = ${token} and expires_at > now() limit 1
  `;

  return rows[0]?.user_id ?? null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (openPaths.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  const userId = await sessionUserId(request);

  if (!userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const match = contactPath.exec(pathname);

  if (!match) {
    return NextResponse.next();
  }

  // Someone else's contact and a missing one both get the same 404 page.
  const contactId = Number(match[1]);
  const rows = await database()`
    select id from contacts where id = ${contactId} and user_id = ${userId} limit 1
  `;

  if (rows.length > 0) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/missing-contact";
  return NextResponse.rewrite(url, { status: 404 });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|jpg|webp|css|js|map)$).*)",
  ],
};
