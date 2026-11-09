import { betterAuth, type BetterAuthOptions, type BetterAuthPlugin } from "better-auth";
import { magicLink } from "better-auth/plugins";

const MAGIC_LINK_SECONDS = 15 * 60;

type MagicLinkMail = {
  email: string;
  url: string;
  token: string;
};

type VerificationRow = {
  identifier: string;
  value: string;
};

// Where an expired or already used link lands.
export const EXPIRED_LINK_PAGE = "/login/expired";

export function createAuth(input: {
  database: NonNullable<BetterAuthOptions["database"]>;
  baseURL: string;
  secret: string;
  sendMagicLink: (letter: MagicLinkMail) => Promise<void> | void;
  plugins?: BetterAuthPlugin[];
}) {
  return betterAuth({
    baseURL: input.baseURL,
    secret: input.secret,
    database: input.database,
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 0,
    },
    plugins: [
      magicLink({
        expiresIn: MAGIC_LINK_SECONDS,
        rateLimit: { window: 60, max: 1000 },
        sendMagicLink: async ({ email, url, token }) => {
          await input.sendMagicLink({ email, url, token });
        },
      }),
      ...(input.plugins ?? []),
    ],
  });
}

export async function requestMagicLink(auth: ReturnType<typeof createAuth>, email: string) {
  const ctx = await auth.$context;
  const rows = (await ctx.adapter.findMany({ model: "verification" })) as VerificationRow[];

  for (const row of rows) {
    let parsed: { type?: string; email?: string } = {};
    try {
      parsed = JSON.parse(row.value) as { type?: string; email?: string };
    } catch {
      continue;
    }
    if (parsed.type === "magic-link" && parsed.email === email) {
      await ctx.internalAdapter.deleteVerificationByIdentifier(row.identifier);
    }
  }

  console.info("sign-in link requested");
  return auth.api.signInMagicLink({
    body: { email, callbackURL: "/", errorCallbackURL: EXPIRED_LINK_PAGE },
    headers: new Headers({ origin: new URL(auth.options.baseURL).origin }),
  });
}
