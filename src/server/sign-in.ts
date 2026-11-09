"use server";

import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";
import { signInLetters, user } from "@/db/schema";
import { requestMagicLink } from "@/lib/auth";
import { decideSignInLetter } from "@/lib/sign-in";

export type SignInState = {
  message?: string;
  error?: string;
};

const SEND_FAILED = "Не получилось отправить письмо";
const WINDOW_MS = 10 * 60 * 1000;

export async function requestSignIn(_state: SignInState, formData: FormData): Promise<SignInState> {
  const rawEmail = String(formData.get("email") ?? "");
  const now = new Date();
  const email = rawEmail.trim().toLowerCase();

  try {
    const [recent, existing] = await Promise.all([
      db
        .select({ sentAt: signInLetters.sentAt })
        .from(signInLetters)
        .where(
          and(
            eq(signInLetters.email, email),
            gt(signInLetters.sentAt, new Date(now.getTime() - WINDOW_MS)),
          ),
        ),
      db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1),
    ]);

    let send = false;
    const decision = decideSignInLetter({
      rawEmail,
      now,
      sentAt: recent.map((row) => row.sentAt),
      accountExists: existing.length > 0,
      send: () => {
        send = true;
      },
    });

    if (!decision.ok || !send) {
      return { error: decision.message };
    }

    await db.insert(signInLetters).values({ email, sentAt: now });
    await requestMagicLink(auth, email);

    return { message: decision.message };
  } catch (error) {
    unstable_rethrow(error);
    console.error("requestSignIn failed");
    return { error: SEND_FAILED };
  }
}

export async function signOut() {
  // Only this device's session is removed; other devices keep theirs.
  await auth.api.signOut({ headers: await headers() });
  console.info("signed out");
  redirect("/login");
}
