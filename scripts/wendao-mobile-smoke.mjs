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
  const homeResponse = await page.goto(`${baseUrl}/`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  const homeGeometry = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  await page.screenshot({ path: resolve(artifacts, "wendao-mobile-home.png") });
  await page.screenshot({
    path: resolve(artifacts, "wendao-mobile-home-full.png"),
    fullPage: true,
  });

  const nameResponse = await page.goto(`${baseUrl}/name`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  await page.screenshot({ path: resolve(artifacts, "wendao-mobile-name-form.png") });
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
  const babyResultCards = await page.getByText("综合衡分", { exact: true }).count();
  const source = await panel
    .locator("span")
    .filter({ hasText: /^(本地规则|AI解读)/ })
    .first()
    .innerText();

  const companyResponse = await page.goto(`${baseUrl}/name`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "公司", exact: true }).click();
  await page.getByText("行业", { exact: true }).first().waitFor();
  const companyLengthControls = await page
    .getByRole("button", { name: /^(两字|三字|四字)$/ })
    .count();
  await page.screenshot({ path: resolve(artifacts, "wendao-mobile-company-form.png") });
  await page.getByRole("button", { name: "衡字号", exact: true }).click();
  const companyScoreLabel = page.getByText("综合衡分", { exact: true }).first();
  await companyScoreLabel.waitFor({ timeout: 15_000 });
  const companyResultCards = await page.getByText("综合衡分", { exact: true }).count();
  await companyScoreLabel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(artifacts, "wendao-mobile-company-results.png") });

  const verdict = {
    ok:
      homeResponse?.status() === 200 &&
      nameResponse?.status() === 200 &&
      companyResponse?.status() === 200 &&
      homeGeometry.scrollWidth <= homeGeometry.viewportWidth + 1 &&
      geometry.scrollWidth <= geometry.viewportWidth + 1 &&
      geometry.panel !== null &&
      Math.abs(geometry.panel.left - geometry.panel.right) <= 1 &&
      babyResultCards > 0 &&
      companyResultCards > 0 &&
      companyLengthControls === 0 &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0,
    status: {
      home: homeResponse?.status() ?? 0,
      name: nameResponse?.status() ?? 0,
      company: companyResponse?.status() ?? 0,
    },
    resultCards: { baby: babyResultCards, company: companyResultCards },
    companyLengthControls,
    source,
    geometry: { home: homeGeometry, result: geometry },
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
