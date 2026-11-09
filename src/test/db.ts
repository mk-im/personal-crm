import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for database tests; run `pnpm db:migrate` first");
}

const createdUserIds: string[] = [];

export async function createTestUser(label: string) {
  const id = crypto.randomUUID();
  const email = `${label}.${id.slice(0, 8)}@example.test`;
  await db.insert(user).values({ id, name: email, email, emailVerified: true });
  createdUserIds.push(id);
  return { id, email };
}

export async function deleteTestUsers() {
  if (createdUserIds.length > 0) {
    // Contacts, notes, and groups cascade from the user row.
    await db.delete(user).where(inArray(user.id, createdUserIds.splice(0)));
  }
}

export async function deleteUserByEmail(email: string) {
  await db.delete(user).where(eq(user.email, email));
}
