import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { freshEmail, signIn } from "./helpers/auth";
import { markContactOverdue } from "./helpers/db";

const stamp = Date.now();
const userEmail = freshEmail("keep-in-touch");
let signedIn: Awaited<ReturnType<BrowserContext["storageState"]>>;

// One sign-in for the file; each test gets the same session cookies.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userEmail);
  signedIn = await context.storageState();
  await context.close();
});

test.beforeEach(async ({ context }) => {
  await context.addCookies(signedIn.cookies);
});

async function createContact(page: Page, name: string) {
  await page.goto("/contacts/new");
  await page.getByLabel("Имя").fill(name);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

async function setFrequency(page: Page, label: string) {
  await page.getByRole("link", { name: "Изменить" }).click();
  await expect(page.getByRole("heading", { name: "Изменить контакт" })).toBeVisible();
  await page.getByLabel("Как часто общаться").selectOption({ label });
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

async function expectAbsentFromDueBlock(page: Page, name: string) {
  await page.goto("/");
  const due = page.getByRole("region", { name: "Пора связаться" });

  if ((await due.count()) === 0) {
    return;
  }

  await expect(due.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);
}

test("frequency on the card", async ({ page }) => {
  const name = `E2E Частота ${stamp}`;

  await createContact(page, name);
  await expect(page.getByText("Как часто общаться")).toHaveCount(0);
  await expectAbsentFromDueBlock(page, name);

  await page.goto(`/?q=${encodeURIComponent(name)}`);
  await page
    .getByRole("link", { name: new RegExp(name) })
    .first()
    .click();
  await setFrequency(page, "Раз в месяц");
  await expect(page.getByText("Раз в месяц")).toBeVisible();

  await setFrequency(page, "Не задано");
  await expect(page.getByText("Как часто общаться")).toHaveCount(0);
  await expect(page.getByText("Раз в месяц")).toHaveCount(0);
  await expectAbsentFromDueBlock(page, name);
});

test("overdue contact appears in the due block", async ({ page }) => {
  const name = `E2E Просрочка ${stamp}`;

  await createContact(page, name);
  await setFrequency(page, "Раз в неделю");
  await expect(page.getByText("Раз в неделю")).toBeVisible();

  await markContactOverdue(userEmail, name, 400);
  await page.goto("/");
  const due = page.getByRole("region", { name: "Пора связаться" });
  const row = due.getByRole("link", { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Раз в неделю");
  await expect(row).toContainText(/на \d+ (день|дня|дней)/);

  await row.click();
  await expect(page).toHaveURL(/\/contacts\/\d+/);
  await expect(page.getByRole("heading", { name })).toBeVisible();

  await page.goto(`/?q=${encodeURIComponent(name)}`);
  await expect(page.getByRole("region", { name: "Пора связаться" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
});

test("a new note removes the contact from the due block", async ({ page }) => {
  const name = `E2E Заметка ${stamp}`;

  await createContact(page, name);
  await setFrequency(page, "Раз в неделю");
  await markContactOverdue(userEmail, name, 400);

  await page.goto("/");
  const due = page.getByRole("region", { name: "Пора связаться" });
  await due.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();

  await page.getByLabel("Заметка после разговора").fill(`Связались ${stamp}`);
  await page.getByRole("button", { name: "Добавить заметку" }).click();
  await expect(page.getByText(`Связались ${stamp}`)).toBeVisible();

  await expectAbsentFromDueBlock(page, name);
});
