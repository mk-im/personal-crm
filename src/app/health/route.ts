import { sql } from "drizzle-orm";

import { db } from "@/db";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true }, { status: 200 });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
