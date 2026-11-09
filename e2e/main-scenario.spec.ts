import { expect, test, type Page } from "@playwright/test";

import { ownerEmail, signIn } from "./helpers/auth";
import { markContactMostOverdue } from "./helpers/db";

const stamp = Date.now();
const contactName = `E2E Main ${stamp}`;
const noteText = `Заметка e2e ${stamp}`;
const editedPhone = "+7 900 000-00-01";
const editedThrough = `встреча e2e ${stamp}`;
const groupA = `E2E Альфа ${stamp}`;
const groupB = `E2E Бета ${stamp}`;

async function searchContact(page: Page, name: string) {
  await page.goto(`/?q=${encodeURIComponent(name)}`);
  await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
}

async function chooseFrequency(page: Page, label: string) {
  await page.getByLabel("Как часто общаться").selectOption({ label });
}

test("main scenario from product idea", async ({ page, browser }) => {
  // The owner signs in first; everything below is that user's data.
  await signIn(page, ownerEmail);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Контакты" })).toBeVisible();
  await expect(page.getByText(/Всего \d+ контакт/)).toBeVisible();

  await page.getByRole("link", { name: "Добавить контакт" }).click();
  await page.getByLabel("Имя").fill(contactName);
  await page.getByLabel("Откуда знакомы").fill("тест e2e");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("heading", { name: contactName })).toBeVisible();

  await searchContact(page, contactName);
  await page
    .getByRole("link", { name: new RegExp(contactName) })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: contactName })).toBeVisible();

  await page.getByLabel("Заметка после разговора").fill(noteText);
  await page.getByRole("button", { name: "Добавить заметку" }).click();
  await expect(page.getByText(noteText)).toBeVisible();

  await page.getByRole("link", { name: "Изменить" }).click();
  await expect(page.getByRole("heading", { name: "Изменить контакт" })).toBeVisible();
  await page.getByRole("textbox", { name: "Телефон" }).fill(editedPhone);
  await page.getByRole("textbox", { name: "Откуда знакомы" }).fill(editedThrough);
  await chooseFrequency(page, "Раз в неделю");
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(page.getByRole("heading", { name: contactName })).toBeVisible();
  await expect(page.getByText(editedPhone)).toBeVisible();
  await expect(page.getByText(editedThrough)).toBeVisible();
  await expect(page.getByText("Раз в неделю")).toBeVisible();

  // The same signed-in person in another browser sees the same contacts.
  // The session is carried over instead of a second letter, so reruns stay under the letter limit.
  const contactPageUrl = page.url();
  const other = await browser.newContext({ storageState: await page.context().storageState() });
  const otherPage = await other.newPage();
  await otherPage.goto(contactPageUrl);
  await expect(otherPage.getByRole("heading", { name: contactName })).toBeVisible();
  await expect(otherPage.getByText(noteText)).toBeVisible();
  await expect(otherPage.getByText(editedPhone)).toBeVisible();
  await other.close();

  await markContactMostOverdue(ownerEmail, contactName);
  await page.goto("/");
  const due = page.getByRole("region", { name: "Пора связаться" });
  await expect(due).toBeVisible();
  await expect(due.getByRole("link", { name: new RegExp(contactName) })).toBeVisible();

  await page.getByRole("link", { name: "Группы" }).click();
  await page.getByLabel("Новая группа").fill(groupA);
  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page.getByText(groupA, { exact: true }).first()).toBeVisible();
  await page.getByLabel("Новая группа").fill(groupB);
  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page.getByText(groupB, { exact: true }).first()).toBeVisible();

  await searchContact(page, contactName);
  await page
    .getByRole("link", { name: new RegExp(contactName) })
    .first()
    .click();
  await page.getByRole("link", { name: "Изменить" }).click();
  await page.getByRole("checkbox", { name: groupA }).check();
  await page.getByRole("checkbox", { name: groupB }).check();
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(page.getByText(`${groupA}, ${groupB}`)).toBeVisible();

  await page.goto("/");
  const sectionA = page.locator("section").filter({
    has: page.getByRole("heading", { name: groupA, exact: true }),
  });
  const sectionB = page.locator("section").filter({
    has: page.getByRole("heading", { name: groupB, exact: true }),
  });
  await expect(sectionA.getByRole("link", { name: new RegExp(contactName) })).toBeVisible();
  await expect(sectionB.getByRole("link", { name: new RegExp(contactName) })).toBeVisible();

  await sectionA.getByRole("link", { name: new RegExp(contactName) }).click();
  await expect(page).toHaveURL(/\/contacts\/\d+/);
  const contactUrl = page.url();
  await expect(page.getByRole("heading", { name: contactName })).toBeVisible();
  await page.waitForLoadState("networkidle");

  await page.locator("summary", { hasText: "Удалить" }).click();
  await page.getByRole("button", { name: "Точно удалить?" }).click();
  await expect(page.getByRole("heading", { name: "Контакты" })).toBeVisible();

  await page.goto(`/?q=${encodeURIComponent(contactName)}`);
  await expect(page.getByRole("link", { name: new RegExp(contactName) })).toHaveCount(0);

  const deletedResponse = await page.goto(contactUrl, { waitUntil: "domcontentloaded" });
  expect(deletedResponse?.status()).toBe(404);
});
