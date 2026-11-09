import nodemailer from "nodemailer";

export type MailSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
};

export type OutgoingLetter = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

type MailSender = {
  sendMail: (message: OutgoingLetter) => Promise<unknown>;
};

export function readMailSettings(env: Record<string, string | undefined>): MailSettings {
  return {
    host: env.MAIL_HOST ?? "",
    port: Number(env.MAIL_PORT ?? ""),
    secure: env.MAIL_SECURE === "true",
    user: env.MAIL_USER ?? "",
    password: env.MAIL_PASSWORD ?? "",
    from: env.MAIL_FROM ?? "",
  };
}

export function createMailTransport(settings: MailSettings, sender?: MailSender) {
  // The local stub takes letters without a login; a real SMTP server needs one.
  const options = {
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    ...(settings.user ? { auth: { user: settings.user, pass: settings.password } } : {}),
  };

  if (sender) {
    return { options, sendMail: sender.sendMail };
  }

  const transport = nodemailer.createTransport(options);
  return {
    options,
    sendMail: (message: OutgoingLetter) => transport.sendMail(message),
  };
}
