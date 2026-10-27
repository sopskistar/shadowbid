import { chromium } from "@playwright/test";
import path from "node:path";
const browser = await chromium.launch({
  executablePath:
    "/home/sopski/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
});
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
  });
  await page.goto("http://localhost:3105/" + (process.argv[2] || "MyComp"));
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.resolve("output/studio-preview.png") });
  console.log("Studio loaded:", await page.title());
} finally {
  await browser.close();
}
