import { describe, expect, it, vi } from "vitest";

import { SIGN_IN_LINK_SENT, TOO_MANY_SIGN_IN_LETTERS, decideSignInLetter } from "./sign-in";

const now = new Date("2026-11-09T12:09:00.000Z");

function sentAt(iso: string) {
  return new Date(iso);
}

describe("decideSignInLetter", () => {
  it("New email", () => {
    const send = vi.fn();
    const result = decideSignInLetter({
      rawEmail: "  New@Example.COM ",
      now,
      sentAt: [],
      accountExists: false,
      send,
    });

    expect(result).toEqual({ ok: true, message: SIGN_IN_LINK_SENT("new@example.com") });
    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith({ to: "new@example.com" });
  });

  it("Existing email", () => {
    const send = vi.fn();
    const result = decideSignInLetter({
      rawEmail: "new@example.com",
      now,
      sentAt: [],
      accountExists: true,
      send,
    });

    expect(result).toEqual({ ok: true, message: SIGN_IN_LINK_SENT("new@example.com") });
    expect(send).toHaveBeenCalledOnce();
  });

  it("Fourth letter is refused", () => {
    const send = vi.fn();
    const result = decideSignInLetter({
      rawEmail: "new@example.com",
      now,
      sentAt: [
        sentAt("2026-11-09T12:00:00.000Z"),
        sentAt("2026-11-09T12:03:00.000Z"),
        sentAt("2026-11-09T12:07:00.000Z"),
      ],
      accountExists: true,
      send,
    });

    expect(result).toEqual({ ok: false, message: TOO_MANY_SIGN_IN_LETTERS });
    expect(send).not.toHaveBeenCalled();
  });
});
