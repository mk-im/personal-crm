import { expect, test } from "@playwright/test";

import { freshEmail, requestLink, signIn } from "./helpers/auth";
import { countLetters, latestLetter } from "./helpers/mail";

test("Open the app without a session", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
  await expect(page.getByText("Выйти")).toHaveCount(0);

  const health = await page.request.get("/health");
  expect(health.status()).toBe(200);
});

test("Request a link", async ({ page }) => {
  const email = freshEmail("request");
  await requestLink(page, email);

  await page.getByLabel("Почта").fill("not an address");
  await page.getByRole("button", { name: "Получить ссылку" }).click();
  await expect(page.getByRole("alert")).toContainText("Проверь адрес почты");
});

test("Browser test reads the link from the stub", async ({ page }) => {
  const email = freshEmail("stub");
  await requestLink(page, email);

  const letter = await latestLetter(email);
  expect(letter.Subject).toBe("Вход в Личную CRM");
  expect(letter.From.Name).toBe("Личная CRM");
  expect(letter.From.Address.startsWith("noreply@mail.crm.")).toBe(true);
  expect(letter.link).toContain("/api/auth/magic-link/verify");
  expect(await countLetters(email)).toBe(1);
});

test("Open a fresh link", async ({ page }) => {
  const email = freshEmail("fresh");
  await signIn(page, email);

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Контакты" })).toBeVisible();
});

test("First visit creates the account", async ({ page }) => {
  const email = freshEmail("first");
  await signIn(page, email);

  await expect(page.getByRole("navigation", { name: "Аккаунт" })).toContainText(email);

  await page.goto("/contacts/new");
  await expect(page.getByRole("heading", { name: "Новый контакт" })).toBeVisible();
});

test("Open the link a second time", async ({ page, browser }) => {
  const email = freshEmail("twice");
  const letter = await signIn(page, email);

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto(letter.link);
  await expect(
    otherPage.getByRole("heading", { name: "Ссылка устарела, запроси новую" }),
  ).toBeVisible();
  await otherPage.getByRole("link", { name: "Запросить новую ссылку" }).click();
  await expect(otherPage.getByRole("heading", { name: "Вход" })).toBeVisible();
  await other.close();
});

test("Signed-in header", async ({ page }) => {
  const email = freshEmail("header");
  await signIn(page, email);

  const account = page.getByRole("navigation", { name: "Аккаунт" });
  await expect(account).toContainText(email);
  await expect(account.getByRole("button", { name: "Выйти" })).toBeVisible();
  await expect(account.getByRole("link", { name: "Группы" })).toBeVisible();
});

test("Sign out", async ({ page }) => {
  const email = freshEmail("signout");
  await signIn(page, email);

  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText(email)).toHaveCount(0);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("First list", async ({ page }) => {
  const email = freshEmail("empty");
  await signIn(page, email);

  await expect(page.getByText("Всего 0 контактов")).toBeVisible();
  await expect(page.getByText("Добавь первый контакт")).toBeVisible();
});
