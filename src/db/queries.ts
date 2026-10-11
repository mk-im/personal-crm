import { asc, desc, eq, ilike } from "drizzle-orm";

import { db } from "./index";
import { contacts, notes } from "./schema";

function likePattern(query: string) {
  const escaped = query.replace(/[\\%_]/g, "\\$&");
  return `%${escaped}%`;
}

export async function listContacts(query: string) {
  const nameFilter = query ? ilike(contacts.name, likePattern(query)) : undefined;

  return db
    .select({
      id: contacts.id,
      name: contacts.name,
      metThrough: contacts.metThrough,
    })
    .from(contacts)
    .where(nameFilter)
    .orderBy(asc(contacts.name));
}

export async function getContact(id: number) {
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);

  if (!contact) {
    return null;
  }

  const contactNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.contactId, id))
    .orderBy(desc(notes.createdAt));

  return { contact, notes: contactNotes };
}
