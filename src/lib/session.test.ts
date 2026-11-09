import { memoryAdapter } from "better-auth/adapters/memory";
import { describe, expect, it } from "vitest";

import { createAuth, requestMagicLink } from "./auth";

const origin = "http://localhost:3000";
const DAY = 24 * 60 * 60 * 1000;

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

async function signIn(
  auth: ReturnType<typeof createAuth>,
  email: string,
  sent: { token: string }[],
) {
  const before = sent.length;
  await requestMagicLink(auth, email);
  const response = await auth.api.magicLinkVerify({
    query: { token: sent[before].token, callbackURL: "/" },
    headers: new Headers({ origin }),
    asResponse: true,
  });
  const raw = response.headers.get("set-cookie") ?? "";
  return new Headers({ cookie: raw.split(";")[0], origin });
}

describe("session", () => {
  it("Return within 30 days", async () => {
    const { auth, sent, db } = createHarness();
    const headers = await signIn(auth, "a@example.com", sent);
    const session = db.session[0] as { expiresAt: Date; token: string };
    session.expiresAt = new Date(Date.now() + DAY);

    const current = await auth.api.getSession({ headers });
    const refreshed = db.session.find(
      (row) => (row as { token: string }).token === session.token,
    ) as unknown as {
      expiresAt: Date;
    };

    expect(current?.user.email).toBe("a@example.com");
    expect(refreshed.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * DAY);
  });

  it("Return after 30 days", async () => {
    const { auth, sent, db } = createHarness();
    const headers = await signIn(auth, "a@example.com", sent);
    const session = db.session[0] as { expiresAt: Date };
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * DAY);
    session.expiresAt = new Date(Date.now() - DAY);

    expect(await auth.api.getSession({ headers })).toBeNull();
  });

  it("Sign out on one device", async () => {
    const { auth, sent } = createHarness();
    const phone = await signIn(auth, "a@example.com", sent);
    const computer = await signIn(auth, "a@example.com", sent);

    await auth.api.signOut({ headers: phone });

    expect(await auth.api.getSession({ headers: phone })).toBeNull();
    expect((await auth.api.getSession({ headers: computer }))?.user.email).toBe("a@example.com");
  });
});
