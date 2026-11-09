import { memoryAdapter } from "better-auth/adapters/memory";
import { describe, expect, it } from "vitest";

import { createAuth, requestMagicLink } from "./auth";

const origin = "http://localhost:3000";

function createHarness() {
  const sent: { email: string; url: string; token: string }[] = [];
  const db = { user: [], session: [], account: [], verification: [] };
  const auth = createAuth({
    database: memoryAdapter(db),
    baseURL: origin,
    secret: "test-secret-at-least-32-characters-long",
    sendMagicLink: async (letter) => {
      sent.push(letter);
    },
  });
  return { auth, sent, db };
}

async function openLink(auth: ReturnType<typeof createAuth>, token: string) {
  return auth.api.magicLinkVerify({
    query: { token, callbackURL: "/" },
    headers: new Headers({ origin }),
    asResponse: true,
  });
}

function letsThePersonIn(response: Response) {
  const location = response.headers.get("location") ?? "";
  return response.status === 302 && !location.includes("error=");
}

describe("magic link", () => {
  it("Request a second link", async () => {
    const { auth, sent } = createHarness();
    await requestMagicLink(auth, "a@example.com");
    await requestMagicLink(auth, "a@example.com");

    expect(letsThePersonIn(await openLink(auth, sent[0].token))).toBe(false);
    expect(letsThePersonIn(await openLink(auth, sent[1].token))).toBe(true);
  });

  it("Open the link after 15 minutes", async () => {
    const { auth, sent, db } = createHarness();
    await requestMagicLink(auth, "a@example.com");
    const row = db.verification[0] as { createdAt: Date; expiresAt: Date };

    expect(row.expiresAt.getTime() - row.createdAt.getTime()).toBe(15 * 60 * 1000);
    row.expiresAt = new Date(Date.now() - 1000);

    expect(letsThePersonIn(await openLink(auth, sent[0].token))).toBe(false);
  });

  it("Open the link a second time", async () => {
    const { auth, sent } = createHarness();
    await requestMagicLink(auth, "a@example.com");

    expect(letsThePersonIn(await openLink(auth, sent[0].token))).toBe(true);
    expect(letsThePersonIn(await openLink(auth, sent[0].token))).toBe(false);
  });
});
