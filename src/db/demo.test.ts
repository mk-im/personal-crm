import { afterAll, describe, expect, it } from "vitest";

import { seedDemoData } from "./demo";
import { listContacts } from "./queries";
import { createTestUser, deleteTestUsers, deleteUserByEmail } from "@/test/db";

const ownerEmail = `demo.owner.${crypto.randomUUID().slice(0, 8)}@example.test`;

afterAll(async () => {
  await deleteUserByEmail(ownerEmail);
  await deleteTestUsers();
});

describe("demo data", () => {
  it("A second person does not see the demo contacts", async () => {
    const seeded = await seedDemoData({ ownerEmail, count: 12 });
    const other = await createTestUser("second");

    expect(seeded).toMatchObject({ status: "seeded", contacts: 12 });
    expect(await listContacts(other.id, "")).toEqual([]);
    expect((await listContacts(seeded.ownerId, "")).length).toBe(12);
  });

  it("Seed stops without an owner email", async () => {
    await expect(seedDemoData({ ownerEmail: "   ", count: 3 })).rejects.toThrow(
      "OWNER_EMAIL is not set",
    );
  });
});
