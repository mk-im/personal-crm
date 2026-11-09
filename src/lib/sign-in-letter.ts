const FROM_NAME = "Личная CRM";
const SUBJECT = "Вход в Личную CRM";
const IGNORE = "Если вы не запрашивали вход - просто проигнорируйте письмо";
const EXPIRES = "Ссылка работает 15 минут.";

export type SignInLetter = {
  fromName: typeof FROM_NAME;
  fromAddress: string;
  to: string;
  subject: typeof SUBJECT;
  url: string;
  text: string;
  html: string;
};

export function buildSignInLetter(input: {
  to: string;
  url: string;
  fromAddress: string;
}): SignInLetter {
  if (!input.fromAddress.startsWith("noreply@mail.crm.")) {
    throw new Error("Sign-in from address must start with noreply@mail.crm.");
  }

  const text = [`Войти: ${input.url}`, EXPIRES, IGNORE].join("\n");
  const html = [
    `<p><a href="${input.url}">Войти</a></p>`,
    `<p>${EXPIRES}</p>`,
    `<p>${IGNORE}</p>`,
  ].join("");

  return {
    fromName: FROM_NAME,
    fromAddress: input.fromAddress,
    to: input.to,
    subject: SUBJECT,
    url: input.url,
    text,
    html,
  };
}
