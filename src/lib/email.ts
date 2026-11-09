export const INVALID_EMAIL_MESSAGE = "Проверь адрес почты";

export type SignInAddress =
  { ok: true; email: string } | { ok: false; message: typeof INVALID_EMAIL_MESSAGE };

export function parseSignInEmail(raw: string): SignInAddress {
  const email = raw.trim().toLowerCase();
  const parts = email.split("@");
  const domain = parts[1] ?? "";
  const valid =
    parts.length === 2 &&
    parts[0].length > 0 &&
    domain.length > 0 &&
    !email.includes(" ") &&
    domain.includes(".");

  if (!valid) {
    return { ok: false, message: INVALID_EMAIL_MESSAGE };
  }

  return { ok: true, email };
}

export function requestSignInAddress(
  raw: string,
  send: (mail: { to: string }) => void,
): SignInAddress {
  const parsed = parseSignInEmail(raw);

  if (!parsed.ok) {
    return parsed;
  }

  send({ to: parsed.email });
  return parsed;
}
