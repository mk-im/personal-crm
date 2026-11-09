import { seedDemoData } from "./demo";

async function seed() {
  const ownerEmail = process.env.OWNER_EMAIL ?? "";

  if (!ownerEmail.trim()) {
    console.error("OWNER_EMAIL is not set: demo data needs an owner, seed stopped");
    process.exit(1);
  }

  const result = await seedDemoData({ ownerEmail, count: 1000 });

  if (result.status === "skipped") {
    console.log(`Seed skipped: the owner already has ${result.contacts} contacts`);
  } else {
    console.log(`Seeded ${result.contacts} contacts and ${result.notes} notes for the owner`);
  }

  process.exit(0);
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
