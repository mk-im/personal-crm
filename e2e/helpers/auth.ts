import { expect, type Page } from "@playwright/test";

import { latestLetter } from "./mail";

// The owner from settings; tests without one fall back to a stub-only address.
export const ownerEmail = (process.env.OWNER_EMAIL ?? "owner@example.test").trim().toLowerCase();

export function freshEmail(label: string) {
  return `${label}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.test`;
}

export async function requestLink(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Почта").fill(email);
  await page.getByRole("button", { name: "Получить ссылку" }).click();
  await expect(page.getByRole("status")).toContainText(`Ссылка для входа отправлена на ${email}`);
}

export async function signIn(page: Page, email: string) {
  const requestedAt = Date.now() - 1000;
  await requestLink(page, email);
  const letter = await latestLetter(email, { after: requestedAt });
  await page.goto(letter.link);
  await expect(page.getByRole("heading", { name: "Контакты" })).toBeVisible();
  return letter;
}
