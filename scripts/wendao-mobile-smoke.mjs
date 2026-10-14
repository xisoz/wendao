#!/usr/bin/env node
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.WENDAO_PREVIEW_URL || "http://127.0.0.1:8081";
const artifacts = resolve("artifacts");
mkdirSync(artifacts, { recursive: true });

const systemChrome =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(systemChrome) ? { executablePath: systemChrome } : {}),
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(String(error)));

try {
  const response = await page.goto(`${baseUrl}/name`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "填一个例子" }).click();
  await page.waitForFunction(
    () => document.querySelector('input[placeholder="林，或欧阳"]')?.value === "林",
    undefined,
    { timeout: 10_000 },
  );
  await page.getByRole("button", { name: "衡名", exact: true }).click();
  await page.getByText("综合衡分").first().waitFor({ timeout: 15_000 });

  const panel = page
    .getByRole("heading", { name: "把这一批讲明白", exact: true })
    .locator("xpath=ancestor::section[1]");
  await panel.waitFor();
  await panel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(artifacts, "wendao-mobile-results.png") });

  await panel.getByRole("button", { name: "开始深度解读" }).click();
  await panel
    .getByText(/本地规则|AI解读/)
    .first()
    .waitFor({ timeout: 15_000 });
  await panel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(artifacts, "wendao-mobile-ai.png") });
  await panel.screenshot({ path: resolve(artifacts, "wendao-ai-panel.png") });

  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const panelHeading = [...document.querySelectorAll("h2")].find(
      (node) => node.textContent?.trim() === "把这一批讲明白",
    );
    const panelElement = panelHeading?.closest("section");
    const box = panelElement?.getBoundingClientRect();
    return {
      viewportWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      panel: box
        ? {
            left: Math.round(box.left),
            right: Math.round(root.clientWidth - box.right),
            width: Math.round(box.width),
          }
        : null,
    };
  });

  const verdict = {
    ok:
      response?.status() === 200 &&
      geometry.scrollWidth <= geometry.viewportWidth + 1 &&
      geometry.panel !== null &&
      Math.abs(geometry.panel.left - geometry.panel.right) <= 1 &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0,
    status: response?.status() ?? 0,
    resultCards: await page.getByText("综合衡分", { exact: true }).count(),
    source: await panel
      .locator("span")
      .filter({ hasText: /^(本地规则|AI解读)/ })
      .first()
      .innerText(),
    geometry,
    consoleErrors,
    pageErrors,
  };
  console.log(JSON.stringify(verdict, null, 2));
  if (!verdict.ok) process.exitCode = 1;
} catch (error) {
  await page.screenshot({ path: resolve(artifacts, "wendao-mobile-failure.png"), fullPage: true });
  console.error(
    JSON.stringify(
      {
        url: page.url(),
        title: await page.title(),
        consoleErrors,
        pageErrors,
      },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
