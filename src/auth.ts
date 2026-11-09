import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth";
import { createMailTransport, readMailSettings } from "@/lib/mail";
import { buildSignInLetter } from "@/lib/sign-in-letter";

function requiredSetting(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

const mailSettings = readMailSettings(process.env);
const mail = createMailTransport(mailSettings);

// One sign-in setup for the whole app: pages, server actions, and the API route.
export const auth = createAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: requiredSetting("BETTER_AUTH_URL"),
  secret: requiredSetting("BETTER_AUTH_SECRET"),
  // Server actions set and clear the session cookie through Next.
  plugins: [nextCookies()],
  sendMagicLink: async ({ email, url }) => {
    const letter = buildSignInLetter({ to: email, url, fromAddress: mailSettings.from });

    await mail.sendMail({
      from: `"${letter.fromName}" <${letter.fromAddress}>`,
      to: letter.to,
      subject: letter.subject,
      text: letter.text,
      html: letter.html,
    });
    console.info("sign-in letter sent");
  },
});

export type SessionUser = { id: string; email: string };
