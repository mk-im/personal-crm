import { describe, expect, it } from "vitest";

import { buildSignInLetter } from "./sign-in-letter";

describe("buildSignInLetter", () => {
  it("Letter contents", () => {
    const letter = buildSignInLetter({
      to: "a@example.com",
      url: "https://crm.example/magic-link/verify?token=abc",
      fromAddress: "noreply@mail.crm.example.test",
    });

    expect(letter.fromName).toBe("Личная CRM");
    expect(letter.fromAddress.startsWith("noreply@mail.crm.")).toBe(true);
    expect(letter.subject).toBe("Вход в Личную CRM");
    expect(letter.text).toContain("Войти");
    expect(letter.html).toContain(">Войти<");
    expect(letter.html).toContain(letter.url);
    expect(`${letter.text}\n${letter.html}`).toContain("15 минут");
    expect(`${letter.text}\n${letter.html}`).toContain(
      "Если вы не запрашивали вход - просто проигнорируйте письмо",
    );
  });
});
