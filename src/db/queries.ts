import { and, asc, desc, eq, ilike, inArray, isNotNull, sql } from "drizzle-orm";

import { db } from "./index";
import {
  contactGroups,
  contacts,
  groups,
  keepInTouchFrequencies,
  notes,
  type KeepInTouchFrequency,
} from "./schema";

function likePattern(query: string) {
  const escaped = query.replace(/[\\%_]/g, "\\$&");
  return `%${escaped}%`;
}

// Every query takes the owner from the session; nothing here reads the tables whole.
export async function listContacts(userId: string, query: string) {
  const nameFilter = query ? ilike(contacts.name, likePattern(query)) : undefined;

  return db
    .select({
      id: contacts.id,
      name: contacts.name,
      metThrough: contacts.metThrough,
    })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), nameFilter))
    .orderBy(asc(contacts.name));
}

export async function listGroups(userId: string) {
  const rows = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(eq(groups.userId, userId));

  return rows.sort((left, right) => left.name.localeCompare(right.name, "ru"));
}

export async function listMemberships(userId: string, contactIds: number[]) {
  if (contactIds.length === 0) {
    return [];
  }

  return db
    .select({
      contactId: contactGroups.contactId,
      groupId: contactGroups.groupId,
    })
    .from(contactGroups)
    .innerJoin(contacts, eq(contactGroups.contactId, contacts.id))
    .where(and(eq(contacts.userId, userId), inArray(contactGroups.contactId, contactIds)));
}

export type DueContact = {
  id: number;
  name: string;
  keepInTouchFrequency: KeepInTouchFrequency;
  overdueDays: number;
};

export async function listDueContacts(userId: string): Promise<DueContact[]> {
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
        eq(contacts.userId, userId),
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

// Someone else's id and a missing id both come back as null.
export async function getContact(userId: string, id: number) {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.id, id)))
    .limit(1);

  if (!contact) {
    return null;
  }

  const contactNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.contactId, id))
    .orderBy(desc(notes.createdAt));

  const contactGroupRows = await db
    .select({ id: groups.id, name: groups.name })
    .from(contactGroups)
    .innerJoin(groups, eq(contactGroups.groupId, groups.id))
    .where(eq(contactGroups.contactId, id));

  contactGroupRows.sort((left, right) => left.name.localeCompare(right.name, "ru"));

  return { contact, notes: contactNotes, groups: contactGroupRows };
}

export async function contactBelongsTo(userId: string, id: number) {
  const [row] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.id, id)))
    .limit(1);

  return Boolean(row);
}
