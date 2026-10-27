import { chromium, expect } from "@playwright/test";
import postgres from "postgres";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import assert from "node:assert/strict";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../.."),
  project = path.join(root, "demo-video");
const env = JSON.parse(
  await readFile("/tmp/shadowbid-resume-e2e-env.json", "utf8"),
);
const dburl = new URL(env.DATABASE_URL),
  base = env.PLAYWRIGHT_BASE_URL;
assert(
  dburl.hostname === "127.0.0.1" &&
    dburl.port === "55434" &&
    dburl.pathname === "/shadowbid_test",
);
assert(base === "http://127.0.0.1:3102");
const raw = path.join(project, ".private/capture");
await mkdir(raw, { recursive: true, mode: 0o700 });
const out = path.join(project, "public/captures");
await mkdir(out, { recursive: true });
const sql = postgres(env.DATABASE_URL, { max: 1 });
const browser = await chromium.launch({
  executablePath: env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});
const manifest = {
  capturedAt: new Date().toISOString(),
  production: {},
  clips: [],
  checks: [],
  practiceRealDeadlines: true,
};
const contexts = [];
async function session(name, origin = base, record = true) {
  const context = await browser.newContext({
    baseURL: origin,
    viewport: { width: 1440, height: 810 },
    recordVideo: record
      ? { dir: raw, size: { width: 1440, height: 810 } }
      : undefined,
    acceptDownloads: true,
  });
  contexts.push(context);
  const page = await context.newPage();
  const start = Date.now();
  const item = { name, context, page, start, marks: [] };
  item.mark = (label) => {
    const second = (Date.now() - start) / 1000;
    item.marks.push({ label, second });
    console.log("Captured checkpoint:", name, label);
    return second;
  };
  item.finish = async () => {
    const video = page.video();
    await context.close();
    if (record) {
      const file = await video.path();
      const final = path.join(raw, name + ".webm");
      await copyFile(file, final);
      manifest.clips.push({
        name,
        source: `.private/capture/${name}.webm`,
        marks: item.marks,
      });
      await writeFile(
        path.join(project, ".private/capture-manifest.json"),
        JSON.stringify(manifest, null, 2),
        { mode: 0o600 },
      );
    }
  };
  return item;
}
async function signup(context, label) {
  const response = await context.request.post("/api/auth/signup", {
    headers: { origin: base },
    data: {
      email: `film-${label}-${randomUUID()}@example.test`,
      password: randomBytes(24).toString("base64url"),
    },
  });
  assert.equal(response.status(), 200);
}
async function slowClick(page, locator) {
  const box = await locator.boundingBox();
  if (box)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 18,
    });
  await page.waitForTimeout(350);
  await locator.click();
}
async function focus(page, locator) {
  await locator.evaluate((el) =>
    el.scrollIntoView({ block: "center", behavior: "smooth" }),
  );
  await page.waitForTimeout(1100);
}
try {
  // Public production footage: GET requests and UI navigation only.
  const live = await session("production", "https://shadowbid-ashy.vercel.app");
  const auctions = await (
    await live.context.request.get("/api/auctions")
  ).json();
  manifest.production = {
    auctionCount: auctions.length,
    verified: auctions.filter((a) => a.dnsVerifiedAt).length,
    commitments: auctions.reduce((sum, a) => sum + a.commitments, 0),
    finalized: auctions
      .filter((a) => a.finalizedAt)
      .map((a) => ({
        domain: a.domain,
        clearingZats: a.clearingZats,
        completedAt: a.completedAt,
      })),
    health: await (await live.context.request.get("/api/worker/health")).json(),
  };
  await live.page.goto("/");
  await live.page.waitForLoadState("networkidle");
  await live.page.waitForTimeout(1500);
  live.mark("homepage");
  await live.page.screenshot({ path: path.join(out, "production-home.png") });
  await live.page.goto("/auctions");
  await live.page.waitForLoadState("networkidle");
  await live.page
    .getByRole("group", { name: "Marketplace view" })
    .getByRole("button", { name: /Real auctions/ })
    .click();
  await focus(live.page, live.page.getByLabel("Search domains"));
  live.mark("inventory");
  await live.page.waitForTimeout(5500);
  await live.page.screenshot({
    path: path.join(out, "production-inventory.png"),
  });
  const domain = auctions.some((a) => a.domain === "domscout.xyz")
    ? "domscout.xyz"
    : auctions.find((a) => a.dnsVerifiedAt).domain;
  await live.page
    .getByLabel("Search domains")
    .pressSequentially(domain, { delay: 80 });
  await live.page.waitForTimeout(1000);
  live.mark("select-domain");
  await slowClick(
    live.page,
    live.page.getByRole("link", { name: domain, exact: true }),
  );
  await live.page.waitForLoadState("networkidle");
  await live.page.waitForTimeout(1800);
  live.mark("detail");
  await live.page.screenshot({ path: path.join(out, "production-detail.png") });
  await live.page.waitForTimeout(6500);
  await live.finish();
  // Real cryptographic practice; deadlines are allowed to elapse naturally.
  const practice = await session("practice");
  const p = practice.page;
  await p.goto("/try");
  await p.waitForLoadState("networkidle");
  await slowClick(p, p.getByRole("button", { name: /Start practice auction/ }));
  await expect(
    p.getByRole("heading", { name: "private-auction.example" }),
  ).toBeVisible({ timeout: 30000 });
  const practiceId = await p.evaluate(() =>
    sessionStorage.getItem("sb-judge-id"),
  );
  let state = await (
    await practice.context.request.get("/api/judge/" + practiceId)
  ).json();
  practice.mark("started");
  const receipts = [];
  for (const role of ["A", "B"]) {
    const button = p
      .getByRole("button", { name: "Seal bid & download receipt", exact: true })
      .first();
    await focus(p, button);
    practice.mark("seal-" + role);
    const downloadPromise = p.waitForEvent("download");
    await slowClick(p, button);
    const download = await downloadPromise;
    const receipt = JSON.parse(await readFile(await download.path(), "utf8"));
    receipts.push(receipt);
    assert.equal(receipt.role, role);
    await expect(p.getByRole("status")).toContainText(
      `Bidder ${role} sealed a real commitment.`,
    );
    practice.mark("receipt-" + role);
    await p.waitForTimeout(2200);
  }
  await p.screenshot({ path: path.join(out, "practice-sealed.png") });
  const waitBidding = Date.parse(state.biddingEndsAt) - Date.now() + 1500;
  console.log(
    "Practice actual bidding wait seconds:",
    Math.max(0, Math.ceil(waitBidding / 1000)),
  );
  if (waitBidding > 0) await p.waitForTimeout(waitBidding);
  await expect(
    p.getByRole("heading", { name: "Import saved receipt" }).first(),
  ).toBeVisible({ timeout: 12000 });
  practice.mark("reveal-phase");
  await focus(p, p.getByLabel("Import Bidder A receipt"));
  await p.waitForTimeout(1000);
  const tampered = { ...receipts[0], amountZats: "999999999" };
  practice.mark("invalid-upload");
  await p
    .getByLabel("Import Bidder A receipt")
    .setInputFiles({
      name: "modified-demo-receipt.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(tampered)),
    });
  await expect(p.getByRole("alert")).toBeVisible();
  manifest.checks.push("Modified practice receipt rejected by actual server");
  practice.mark("invalid-rejected");
  await p.screenshot({ path: path.join(out, "practice-invalid.png") });
  await p.waitForTimeout(4500);
  for (const receipt of receipts) {
    practice.mark("valid-upload-" + receipt.role);
    await p
      .getByLabel(`Import Bidder ${receipt.role} receipt`)
      .setInputFiles({
        name: "saved-demo-receipt.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(receipt)),
      });
    await expect(p.getByRole("status")).toContainText(
      `Bidder ${receipt.role} reveal accepted`,
    );
    practice.mark("valid-accepted-" + receipt.role);
    await p.waitForTimeout(3500);
  }
  await p.screenshot({ path: path.join(out, "practice-valid.png") });
  state = await (
    await practice.context.request.get("/api/judge/" + practiceId)
  ).json();
  const waitReveal = Date.parse(state.revealEndsAt) - Date.now() + 1500;
  console.log(
    "Practice actual reveal wait seconds:",
    Math.max(0, Math.ceil(waitReveal / 1000)),
  );
  if (waitReveal > 0) await p.waitForTimeout(waitReveal);
  await expect(p.getByRole("heading", { name: "Bidder B wins" })).toBeVisible({
    timeout: 15000,
  });
  await focus(p, p.getByRole("heading", { name: "Bidder B wins" }));
  practice.mark("winner");
  await p.screenshot({ path: path.join(out, "practice-result.png") });
  await p.waitForTimeout(8000);
  manifest.checks.push(
    "Practice actual 2-minute commit + 2-minute reveal deadlines; highest valid reveal B = 0.03 practice ZEC",
  );
  await practice.finish();
  // Independent local accounts; only disposable local deadlines are shortened.
  const seller = await session("seller", base, false);
  await signup(seller.context, "seller");
  const create = await seller.context.request.post("/api/auctions", {
    headers: { origin: base },
    data: {
      domain: "northstar.example",
      description:
        "Isolated film demonstration. No domain offered for sale and no payment requested.",
      startingPrice: "0.01",
      biddingMinutes: 2,
      revealMinutes: 2,
      paymentHours: 24,
      sellerAuthorized: true,
    },
  });
  assert.equal(create.status(), 201);
  const { id } = await create.json();
  const buyer = await session("bidder");
  await signup(buyer.context, "winner");
  const b = buyer.page;
  await b.goto("/auctions/" + id);
  await b.waitForLoadState("networkidle");
  await focus(b, b.getByRole("heading", { name: "Submit a sealed bid" }));
  buyer.mark("form");
  await b.waitForTimeout(1800);
  await b
    .getByLabel("Offer in ZEC", { exact: true })
    .pressSequentially("0.03", { delay: 300 });
  await b.waitForTimeout(1500);
  buyer.mark("submit");
  const downloadPromise = b.waitForEvent("download");
  await slowClick(
    b,
    b.getByRole("button", {
      name: "Seal bid and download secret reveal receipt",
    }),
  );
  const receipt = JSON.parse(
    await readFile(await (await downloadPromise).path(), "utf8"),
  );
  await expect(
    b.getByText("Your bid is sealed.", { exact: false }),
  ).toBeVisible();
  buyer.mark("receipt-downloaded");
  await b.screenshot({ path: path.join(out, "bidder-sealed.png") });
  await b.waitForTimeout(6500);
  const other = await session("other-bidder", base, false);
  await signup(other.context, "other");
  const otherPage = other.page;
  await otherPage.goto("/auctions/" + id);
  await otherPage.getByLabel("Offer in ZEC", { exact: true }).fill("0.02");
  const otherDownload = otherPage.waitForEvent("download");
  await otherPage
    .getByRole("button", {
      name: "Seal bid and download secret reveal receipt",
    })
    .click();
  const otherReceipt = JSON.parse(
    await readFile(await (await otherDownload).path(), "utf8"),
  );
  await sql`update auctions set bidding_ends_at=now()-interval '1 second',reveal_ends_at=now()+interval '2 minutes' where id=${id}`;
  for (const [s, r] of [
    [buyer, receipt],
    [other, otherReceipt],
  ]) {
    await s.page.goto(`/auctions/${id}/reveal`);
    await s.page
      .getByLabel("Upload Bid Receipt")
      .setInputFiles({
        name: "saved-demo-receipt.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(r)),
      });
    await s.page.getByRole("button", { name: "Verify and reveal bid" }).click();
    await expect(
      s.page.getByText("Reveal verified.", { exact: false }),
    ).toBeVisible();
  }
  await sql`update auctions set reveal_ends_at=now()-interval '1 second' where id=${id}`;
  const finalize = await seller.context.request.post(
    `/api/auctions/${id}/finalize`,
    { headers: { origin: base } },
  );
  assert.equal(finalize.status(), 200);
  const anon = await session("public-result");
  await anon.page.goto("/auctions/" + id);
  await expect(
    anon.page.getByText("Final winning price:", { exact: false }),
  ).toBeVisible();
  await anon.page.waitForTimeout(1500);
  anon.mark("final-price");
  await anon.page.screenshot({ path: path.join(out, "public-result.png") });
  await anon.page.waitForTimeout(7500);
  const publicHtml = await anon.page.locator("main").innerText();
  assert(!publicHtml.includes(receipt.bidderId));
  assert(!publicHtml.includes("@example.test"));
  manifest.checks.push(
    "Independent accounts: two valid reveals, server finalization, public 0.03 ZEC result without account identity",
  );
  await anon.finish();
  await b.goto("/auctions/" + id);
  await b.getByRole("link", { name: /Open winning invoice/ }).click();
  await expect(
    b.getByText("Your winning invoice", { exact: false }),
  ).toBeVisible();
  const checkoutPath = new URL(b.url()).pathname;
  assert.equal((await other.context.request.get(checkoutPath)).status(), 404);
  buyer.mark("checkout");
  await b.screenshot({ path: path.join(out, "winner-invoice.png") });
  await b.waitForTimeout(8500);
  assert.equal(
    await b.getByRole("img", { name: "ZIP-321 payment QR code" }).count(),
    0,
  );
  manifest.checks.push(
    "Winner-only local invoice; other bidder denied; payment instructions hidden; no payment simulated",
  );
  await buyer.finish();
  await seller.finish();
  await other.finish();
  await writeFile(
    path.join(project, ".private/capture-manifest.json"),
    JSON.stringify(manifest, null, 2),
    { mode: 0o600 },
  );
  await writeFile(
    path.join(project, "public/captures/evidence.json"),
    JSON.stringify(
      {
        capturedAt: manifest.capturedAt,
        production: manifest.production,
        checks: manifest.checks,
        practiceRealDeadlines: true,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: production read-only capture, real timed practice, independent account commitments/reveals, public result, private unpaid invoice.",
  );
} catch (error) {
  console.error(
    "Capture stopped:",
    error.name,
    String(error.message)
      .replace(/\/checkout\/[^\s"']+/g, "/checkout/[redacted]")
      .slice(0, 700),
  );
  process.exitCode = 1;
} finally {
  for (const c of contexts) await c.close().catch(() => {});
  await browser.close();
  await sql.end();
}
