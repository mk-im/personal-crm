import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

// One connection, so the owner setting below is visible to every migration statement.
const client = postgres(connectionString, { max: 1, onnotice: () => {} });
const db = drizzle(client);

async function run() {
  const ownerEmail = (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();

  // Migrations that assign existing rows read this setting; the email never lives in SQL files.
  await client`select set_config('app.owner_email', ${ownerEmail}, false)`;

  console.info("Applying migrations");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.info("Migrations applied");
}

run()
  .then(() => client.end())
  .then(() => process.exit(0))
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    await client.end();
    process.exit(1);
  });
