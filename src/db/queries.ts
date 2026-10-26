import { and, asc, desc, eq, ilike, isNotNull, sql } from "drizzle-orm";

import { db } from "./index";
import { contacts, keepInTouchFrequencies, notes, type KeepInTouchFrequency } from "./schema";

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

export type DueContact = {
  id: number;
  name: string;
  keepInTouchFrequency: KeepInTouchFrequency;
  overdueDays: number;
};

export async function listDueContacts(): Promise<DueContact[]> {
  const lastConversation = sql`coalesce(
    (select max(${notes.createdAt}) from ${notes} where ${notes.contactId} = ${contacts.id}),
    ${contacts.keepInTouchSetAt}
  )`;
  const periodDays = sql`(case
    when ${contacts.keepInTouchFrequency} = 'weekly' then 7
    when ${contacts.keepInTouchFrequency} = 'monthly' then 30
    when ${contacts.keepInTouchFrequency} = 'quarterly' then 90
    when ${contacts.keepInTouchFrequency} = 'yearly' then 365
  end)`;
  const overdueInterval = sql`now() - (${lastConversation} + (${periodDays} * interval '1 day'))`;

  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      keepInTouchFrequency: contacts.keepInTouchFrequency,
      overdueDays: sql<number>`greatest(1, floor(extract(epoch from ${overdueInterval}) / 86400.0)::int)`,
    })
    .from(contacts)
    .where(
      and(
        isNotNull(contacts.keepInTouchFrequency),
        sql`${lastConversation} is not null`,
        sql`${overdueInterval} > interval '0 seconds'`,
      ),
    )
    .orderBy(sql`${overdueInterval} desc`)
    .limit(5);

  return rows.flatMap((row) => {
    if (!row.keepInTouchFrequency || !keepInTouchFrequencies.includes(row.keepInTouchFrequency)) {
      return [];
    }

    return [
      {
        id: row.id,
        name: row.name,
        keepInTouchFrequency: row.keepInTouchFrequency,
        overdueDays: Number(row.overdueDays),
      },
    ];
  });
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
