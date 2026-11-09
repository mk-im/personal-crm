import { expect, test, type Page } from "@playwright/test";

import { freshEmail, signIn } from "./helpers/auth";

async function createContact(page: Page, name: string) {
  await page.goto("/contacts/new");
  await page.getByLabel("Имя").fill(name);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page).toHaveURL(/\/contacts\/\d+$/);
  return page.url();
}

async function expectHidden(page: Page, name: string, url: string) {
  await page.goto("/");
  await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);

  await page.goto(`/?q=${encodeURIComponent(name)}`);
  await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);
  await expect(page.getByText("Никого не нашли по этому имени")).toBeVisible();

  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Контакт не найден" })).toBeVisible();
}

test("Two users do not see each other's contacts", async ({ browser }) => {
  const stamp = Date.now();
  const nameA = `E2E Изоляция А ${stamp}`;
  const nameB = `E2E Изоляция Б ${stamp}`;

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await signIn(pageA, freshEmail("user-a"));
  await signIn(pageB, freshEmail("user-b"));

  const urlA = await createContact(pageA, nameA);
  const urlB = await createContact(pageB, nameB);

  await pageA.goto("/");
  await expect(pageA.getByRole("link", { name: new RegExp(nameA) })).toBeVisible();
  await expectHidden(pageA, nameB, urlB);

  await pageB.goto("/");
  await expect(pageB.getByRole("link", { name: new RegExp(nameB) })).toBeVisible();
  await expectHidden(pageB, nameA, urlA);

  await contextA.close();
  await contextB.close();
});
