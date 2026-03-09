import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const browserPath = '/opt/google/chrome/chrome';
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
const apiBase = process.env.API_BASE || 'http://127.0.0.1:8787';
const apiKey = '6555ad4bc816473b833223cec29592ae';
const inputFile = path.resolve('skills/runninghub-api-dev/assets/test-inputs/floorplan-white-source.jpg');
const artifactDir = path.resolve('app/e2e/artifacts/2026-03-09-white-label-real');

async function ensure(cond, message) {
  if (!cond) throw new Error(message);
}

async function waitForTask(taskId, timeoutMs = 240000) {
  const deadline = Date.now() + timeoutMs;
  let lastPayload = null;
  while (Date.now() < deadline) {
    const response = await fetch(`${apiBase}/api/tasks/${taskId}/result`, {
      headers: { 'x-runninghub-api-key': apiKey },
    });
    const payload = await response.json();
    lastPayload = payload;
    if (!response.ok) {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    if (payload?.state === 'succeeded' && (payload?.outputUrls?.length || payload?.outputs?.data?.length)) {
      return payload;
    }
    if (payload?.state === 'failed') {
      throw new Error(`任务失败: ${taskId} ${JSON.stringify(payload)}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`等待任务超时: ${taskId} ${JSON.stringify(lastPayload)}`);
}

const browser = await chromium.launch({
  headless: true,
  executablePath: browserPath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

await fs.mkdir(artifactDir, { recursive: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
page.on('console', (msg) => {
  if (['error', 'warning'].includes(msg.type())) {
    console.error(`[browser:${msg.type()}] ${msg.text()}`);
  }
});

try {
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.getByText('应用工作台').waitFor({ timeout: 30000 });

  const homeText = await page.locator('body').innerText();
  await ensure(!/RunningHub/i.test(homeText), '首页仍出现 RunningHub 文案');
  await ensure(!/RunningHub/i.test(await page.title()), '页面标题仍出现 RunningHub 文案');

  const quickApps = await page.locator('.console-quick-apps a').allTextContents();
  await ensure(quickApps.length === 4, `公开应用数量不为 4，实际为 ${quickApps.length}`);
  await page.screenshot({ path: path.join(artifactDir, 'home.png'), timeout: 5000 }).catch(() => {});

  await page.goto(`${baseUrl}/key-center`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '本地密钥配置' }).waitFor({ timeout: 30000 });
  await page.getByLabel('服务密钥').fill(apiKey);
  await page.getByRole('button', { name: '校验额度' }).click({ force: true });
  await page.locator('.metric-grid').waitFor({ timeout: 60000 });
  const balanceCards = await page.locator('.metric-card').allTextContents();
  await page.screenshot({ path: path.join(artifactDir, 'key-center.png'), timeout: 5000 }).catch(() => {});

  await page.goto(`${baseUrl}/workspace/color-plan`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '一键彩平' }).waitFor({ timeout: 30000 });
  const bodyText = await page.locator('body').innerText();
  await ensure(!/RunningHub/i.test(bodyText), '工作台仍出现 RunningHub 文案');
  await page.locator('input[type="file"]').first().setInputFiles(inputFile);

  const [executeResponse] = await Promise.all([
    page.waitForResponse((resp) => resp.url().includes('/api/apps/1994388299756212225/execute') && resp.request().method() === 'POST' && resp.status() === 200, { timeout: 60000 }),
    page.getByRole('button', { name: '开始生成' }).click({ force: true }),
  ]);
  const executePayload = await executeResponse.json();
  const taskId = String(executePayload.taskId || '').trim();
  await ensure(taskId.length > 0, '执行成功但未返回 taskId');

  const taskResult = await waitForTask(taskId);
  const outputUrl = taskResult?.outputUrls?.[0] || taskResult?.outputs?.data?.[0]?.fileUrl;
  await ensure(Boolean(outputUrl), '任务成功但未拿到 outputUrl');

  await page.getByText(taskId).waitFor({ timeout: 10000 }).catch(() => {});
  await page.getByRole('link', { name: '任务记录' }).waitFor({ timeout: 30000 }).catch(() => {});
  await page.screenshot({ path: path.join(artifactDir, 'workspace-color-plan.png'), timeout: 5000 }).catch(() => {});

  await page.goto(`${baseUrl}/tasks?appSlug=color-plan`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '任务归档' }).waitFor({ timeout: 30000 });
  await page.getByText(taskId).waitFor({ timeout: 60000 });
  await ensure(!/RunningHub/i.test(await page.locator('body').innerText()), '任务页仍出现 RunningHub 文案');
  await page.screenshot({ path: path.join(artifactDir, 'tasks.png'), timeout: 5000 }).catch(() => {});

  await page.goto(`${baseUrl}/assets?appSlug=color-plan`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '成果资产索引' }).waitFor({ timeout: 30000 });
  await page.locator('.asset-card img').first().waitFor({ timeout: 60000 });
  await ensure(!/RunningHub/i.test(await page.locator('body').innerText()), '资产页仍出现 RunningHub 文案');
  await page.screenshot({ path: path.join(artifactDir, 'assets.png'), timeout: 5000 }).catch(() => {});

  const summary = {
    checkedAt: new Date().toISOString(),
    quickApps,
    balanceCards,
    taskId,
    outputUrl,
    taskState: taskResult.state,
    artifacts: artifactDir,
  };

  await fs.writeFile(path.join(artifactDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
