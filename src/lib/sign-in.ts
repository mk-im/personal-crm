import { parseSignInEmail, type SignInAddress } from "./email";

export const SIGN_IN_LINK_SENT = (email: string) => `Ссылка для входа отправлена на ${email}`;
export const TOO_MANY_SIGN_IN_LETTERS = "Слишком часто, попробуй через несколько минут";

const WINDOW_MS = 10 * 60 * 1000;
const LETTER_LIMIT = 3;

export type SignInDecision = { ok: true; message: string } | { ok: false; message: string };

export function decideSignInLetter(input: {
  rawEmail: string;
  now: Date;
  sentAt: Date[];
  accountExists: boolean;
  send: (mail: { to: string }) => void;
}): SignInDecision | Extract<SignInAddress, { ok: false }> {
  const parsed = parseSignInEmail(input.rawEmail);

  if (!parsed.ok) {
    return parsed;
  }

  // The message is the same whether this address already has an account.
  void input.accountExists;

  const recent = input.sentAt.filter((sent) => {
    const age = input.now.getTime() - sent.getTime();
    return age >= 0 && age < WINDOW_MS;
  });

  if (recent.length >= LETTER_LIMIT) {
    return { ok: false, message: TOO_MANY_SIGN_IN_LETTERS };
  }

  input.send({ to: parsed.email });
  return { ok: true, message: SIGN_IN_LINK_SENT(parsed.email) };
}
