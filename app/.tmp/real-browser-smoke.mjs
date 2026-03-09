import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const apiKey = process.env.TEST_API_KEY;
const chromePath = process.env.CHROME_BIN || '/opt/google/chrome/chrome';
const screenshotDir = path.resolve('.tmp/browser-smoke');
const testImage = path.resolve('../skills/runninghub-api-dev/assets/test-inputs/floorplan-white-source.jpg');

if (!apiKey) {
  throw new Error('缺少 TEST_API_KEY');
}

await fs.mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await context.newPage();

async function gotoPage(urlPath, screenshotName) {
  await page.goto(`${baseUrl}${urlPath}`, { waitUntil: 'networkidle', timeout: 60000 });
}

async function assertWhiteLabel(urlPath) {
  const text = await page.evaluate(() => `${document.title}\n${document.body.innerText}`);
  const hit = /runninghub|runinghub/i.test(text);
  assert.equal(hit, false, `${urlPath} 页面仍出现上游品牌文案`);
}

const report = {
  baseUrl,
  checkedPages: [],
  sidebarApps: [],
  accountBalance: null,
  taskId: null,
  resultUrl: null,
  taskHistoryContainsTask: false,
  assetsContainResult: false,
};

try {
  await gotoPage('/', '01-home.png');
  await assertWhiteLabel('/');
  report.checkedPages.push('/');

  report.sidebarApps = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.console-quick-apps strong')).map((node) =>
      node.textContent?.trim() || '',
    ),
  );
  assert.deepEqual(report.sidebarApps, [
    '工作台 · 一键彩平',
    '工作台 · 外观迁移',
    '工作台 · 平面转效果',
    '工作台 · 毛坯转效果',
  ]);

  await gotoPage('/key-center', '02-key-center-before-check.png');
  await assertWhiteLabel('/key-center');
  report.checkedPages.push('/key-center');

  const accountResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/account/check') &&
      response.request().method() === 'POST',
    { timeout: 120000 },
  );
  await page.getByLabel('服务密钥').fill(apiKey);
  await page.getByRole('button', { name: '校验额度' }).click({ force: true });
  const accountResponse = await accountResponsePromise;
  assert.equal(accountResponse.status(), 200, '额度校验接口未返回 200');
  await page.waitForTimeout(1500);
  report.accountBalance = await page.locator('.metric-grid .metric-card').allInnerTexts();
  assert.ok(report.accountBalance.some((text) => text.includes('当前可用')));

  await gotoPage('/workspace/color-plan', '04-workspace-before-upload.png');
  await assertWhiteLabel('/workspace/color-plan');
  report.checkedPages.push('/workspace/color-plan');

  await page.getByLabel('上传平面图').setInputFiles(testImage);
  const executeResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/apps/1994388299756212225/execute') &&
      response.request().method() === 'POST',
    { timeout: 120000 },
  );
  await page.getByRole('button', { name: '开始生成' }).click({ force: true });
  const executeResponse = await executeResponsePromise;
  assert.equal(executeResponse.status(), 200, '提交任务接口未返回 200');

  const bodyText = await page.evaluate(() => document.body.innerText);
  assert.equal(bodyText.includes('执行失败'), false, '真实任务执行失败');
  await page.waitForSelector('.result-card img', { timeout: 240000 });
  report.taskId = await page.locator('.task-meta code').innerText();
  report.resultUrl = await page.locator('.result-card a[href^="http"]').last().getAttribute('href');
  assert.ok(report.taskId && report.taskId !== '尚未创建');
  assert.ok(report.resultUrl && /^https?:\/\//.test(report.resultUrl));

  await gotoPage('/tasks', '06-tasks.png');
  await assertWhiteLabel('/tasks');
  report.checkedPages.push('/tasks');
  await page.waitForLoadState('networkidle');
  report.taskHistoryContainsTask = (await page.locator('body').innerText()).includes(report.taskId);
  assert.equal(report.taskHistoryContainsTask, true, '任务记录页未看到最新任务');

  await gotoPage('/assets', '07-assets.png');
  await assertWhiteLabel('/assets');
  report.checkedPages.push('/assets');
  await page.waitForLoadState('networkidle');
  report.assetsContainResult = await page.locator(`img[src="${report.resultUrl}"]`).count().then((count) => count > 0);
  assert.equal(report.assetsContainResult, true, '资产页未看到最新结果图');

  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}
