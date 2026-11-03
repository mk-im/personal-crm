import postgres from "postgres";

function sqlClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is required for e2e helpers");
  }

  return postgres(url, { max: 1 });
}

export async function markContactMostOverdue(name: string) {
  const sql = sqlClient();

  try {
    const [earliest] = await sql<{ at: Date | null }[]>`
      select min(
        coalesce(
          (select max(notes.created_at) from notes where notes.contact_id = contacts.id),
          contacts.keep_in_touch_set_at
        )
      ) as at
      from contacts
      where contacts.keep_in_touch_frequency is not null
        and contacts.name <> ${name}
    `;
    const baseline = earliest?.at ? new Date(earliest.at).getTime() : Date.now();
    const daysAgo = Math.ceil((Date.now() - baseline) / (24 * 60 * 60 * 1000)) + 400;

    await shiftContactConversation(sql, name, daysAgo);
  } finally {
    await sql.end();
  }
}

export async function markContactOverdue(name: string, daysAgo: number) {
  const sql = sqlClient();

  try {
    await shiftContactConversation(sql, name, daysAgo);
  } finally {
    await sql.end();
  }
}

async function shiftContactConversation(
  sql: ReturnType<typeof sqlClient>,
  name: string,
  daysAgo: number,
) {
  const setAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const updated = await sql`
    update contacts
    set keep_in_touch_set_at = ${setAt}
    where name = ${name}
    returning id
  `;

  if (updated.length === 0) {
    throw new Error(`Contact not found for overdue setup: ${name}`);
  }

  // Due date uses the latest note when one exists, not only keep_in_touch_set_at.
  await sql`
    update notes
    set created_at = ${setAt}
    where contact_id = ${updated[0].id}
  `;
}
