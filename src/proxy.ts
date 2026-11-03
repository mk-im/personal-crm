import { NextResponse, type NextRequest } from "next/server";
import postgres from "postgres";

const contactPath = /^\/contacts\/(\d+)$/;

let sql: ReturnType<typeof postgres> | undefined;

function database() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  sql ??= postgres(connectionString, { max: 1 });
  return sql;
}

export async function proxy(request: NextRequest) {
  const match = contactPath.exec(request.nextUrl.pathname);

  if (!match) {
    return NextResponse.next();
  }

  const contactId = Number(match[1]);
  const rows = await database()`select id from contacts where id = ${contactId} limit 1`;

  if (rows.length > 0) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/missing-contact";
  return NextResponse.rewrite(url, { status: 404 });
}

export const config = {
  matcher: "/contacts/:id",
};
