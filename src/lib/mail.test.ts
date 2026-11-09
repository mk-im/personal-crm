import { describe, expect, it } from "vitest";

import { buildSignInLetter } from "./sign-in-letter";
import { createMailTransport, readMailSettings } from "./mail";

const letter = buildSignInLetter({
  to: "a@example.com",
  url: "http://localhost:3000/api/auth/magic-link/verify?token=abc",
  fromAddress: "noreply@mail.crm.example.test",
});

describe("mail settings", () => {
  it("Local mailbox stub", async () => {
    const settings = readMailSettings({
      MAIL_HOST: "127.0.0.1",
      MAIL_PORT: "1025",
      MAIL_SECURE: "false",
      MAIL_USER: "",
      MAIL_PASSWORD: "",
      MAIL_FROM: "noreply@mail.crm.example.test",
    });
    const sent: unknown[] = [];
    const transport = createMailTransport(settings, {
      sendMail: async (message) => {
        sent.push(message);
      },
    });

    await transport.sendMail({
      from: `${letter.fromName} <${settings.from}>`,
      to: letter.to,
      subject: letter.subject,
      text: letter.text,
      html: letter.html,
    });

    expect(settings).toMatchObject({ host: "127.0.0.1", port: 1025, secure: false });
    expect(sent).toHaveLength(1);
  });

  it("Server sends a real letter", async () => {
    const settings = readMailSettings({
      MAIL_HOST: "smtp.resend.com",
      MAIL_PORT: "465",
      MAIL_SECURE: "true",
      MAIL_USER: "resend",
      MAIL_PASSWORD: "re_test_key",
      MAIL_FROM: "noreply@mail.crm.example.test",
    });
    let called = false;
    const transport = createMailTransport(settings, {
      sendMail: async () => {
        called = true;
      },
    });

    expect(transport.options).toMatchObject({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: "re_test_key" },
    });
    expect(called).toBe(false);
  });
});
