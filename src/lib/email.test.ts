import { describe, expect, it, vi } from "vitest";

import { INVALID_EMAIL_MESSAGE, requestSignInAddress } from "./email";

describe("requestSignInAddress", () => {
  it("Trim and lowercase", () => {
    const send = vi.fn();
    const result = requestSignInAddress("  A@Example.COM  ", send);

    expect(result).toEqual({ ok: true, email: "a@example.com" });
    expect(send).toHaveBeenCalledWith({ to: "a@example.com" });
  });

  it("Bad address on the form", () => {
    const send = vi.fn();
    const result = requestSignInAddress("не почта", send);

    expect(result).toEqual({ ok: false, message: INVALID_EMAIL_MESSAGE });
    expect(send).not.toHaveBeenCalled();
  });

  it("Bad address from a direct request", () => {
    const send = vi.fn();
    const result = requestSignInAddress("не почта", send);

    expect(result).toEqual({ ok: false, message: INVALID_EMAIL_MESSAGE });
    expect(send).not.toHaveBeenCalled();
  });
});
