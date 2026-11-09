import { describe, expect, it } from "vitest";

import { resolveContactPage } from "./contact-access";

describe("resolveContactPage", () => {
  it("continues when the contact exists", async () => {
    await expect(resolveContactPage("/contacts/12", async () => true)).resolves.toBe("continue");
  });

  it("reports not-found when the contact is missing", async () => {
    await expect(resolveContactPage("/contacts/12", async () => false)).resolves.toBe("not-found");
  });

  it("continues when the database lookup fails", async () => {
    await expect(
      resolveContactPage("/contacts/12", async () => {
        throw new Error("connection refused");
      }),
    ).resolves.toBe("continue");
  });

  it("does not look up pages that are not a contact card", async () => {
    let called = false;

    await expect(
      resolveContactPage("/contacts/new", async () => {
        called = true;
        return false;
      }),
    ).resolves.toBe("continue");
    await expect(
      resolveContactPage("/contacts/12/edit", async () => {
        called = true;
        return false;
      }),
    ).resolves.toBe("continue");

    expect(called).toBe(false);
  });
});
