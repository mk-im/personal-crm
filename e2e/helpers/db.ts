import postgres from "postgres";

function sqlClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is required for e2e helpers");
  }

  return postgres(url, { max: 1 });
}

export async function markContactOverdue(name: string, daysAgo: number) {
  const sql = sqlClient();

  try {
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
  } finally {
    await sql.end();
  }
}
