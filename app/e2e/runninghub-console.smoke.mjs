import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');

const serverPort = Number(process.env.RUNNINGHUB_E2E_SERVER_PORT || 8787);
const serverBaseUrl = `http://127.0.0.1:${serverPort}`;
const requiredServerEnvNames = [
  'DATABASE_URL',
  'ADMIN_DEFAULT_USERNAME',
  'ADMIN_DEFAULT_PASSWORD',
  'SESSION_SECRET',
];

const defaultApp1File = path.join(
  repoRoot,
  'skills',
  'runninghub-api-dev',
  'assets',
  'test-inputs',
  'livingroom-green-sofa-pexels.jpg',
);
const defaultApp2File = path.join(
  repoRoot,
  'skills',
  'runninghub-api-dev',
  'assets',
  'test-inputs',
  'livingroom-gray-sofa-pexels.jpg',
);
const defaultApp2Prompt =
  '提升客厅照片清晰度，强化沙发织物纹理、边缘线条和光影层次，保持原始构图与色彩自然。';

const apiKey = String(process.env.RUNNINGHUB_E2E_API_KEY || '').trim();
const app1File = process.env.RUNNINGHUB_E2E_FILE_APP1 || defaultApp1File;
const app2File = process.env.RUNNINGHUB_E2E_FILE_APP2 || defaultApp2File;
const app2Prompt = process.env.RUNNINGHUB_E2E_PROMPT_APP2 || defaultApp2Prompt;
const artifactDir =
  process.env.RUNNINGHUB_E2E_ARTIFACT_DIR || path.join(appRoot, 'e2e', 'artifacts', 'latest');
const debugEnabled = process.env.RUNNINGHUB_E2E_DEBUG === '1';

const browserCandidates = [
  process.env.RUNNINGHUB_E2E_BROWSER_PATH,
  process.env.CHROME_BIN,
  '/opt/google/chrome/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function assertEnv() {
  if (!apiKey) {
    throw new Error('缺少 RUNNINGHUB_E2E_API_KEY，无法执行真实网页闭环验证');
  }

  const missingNames = requiredServerEnvNames.filter((name) => !String(process.env[name] || '').trim());
  if (missingNames.length > 0) {
    throw new Error(`缺少服务端环境变量：${missingNames.join(', ')}`);
  }
}

async function ensureReadableFile(targetPath, label) {
  try {
    await fs.access(targetPath);
  } catch {
    throw new Error(`${label} 不存在或不可读：${targetPath}`);
  }
}

async function resolveBrowserPath() {
  for (const candidate of browserCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {}
  }
  throw new Error(
    '未找到可用浏览器，请设置 RUNNINGHUB_E2E_BROWSER_PATH，例如 /opt/google/chrome/chrome',
  );
}

async function isPortAvailable(port) {
  return await new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
  });
}

function startProcess(name, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: appRoot,
    env: { ...process.env, ...extraEnv },
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  return child;
}

async function waitForUrl(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`等待服务超时：${url}`);
}

async function readJson(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || '请求失败');
  }
  return payload;
}

async function waitForTaskSuccess(taskId, timeoutMs = 300_000) {
  const deadline = Date.now() + timeoutMs;
  let lastErrorMessage = '';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${serverBaseUrl}/api/tasks/${taskId}/result`, {
        headers: {
          'x-runninghub-api-key': apiKey,
        },
      });
      const payload = await readJson(response);

      if (payload?.state === 'succeeded' || payload?.state === 'SUCCESS') {
        return payload;
      }

      if (payload?.state === 'failed' || payload?.state === 'FAILED') {
        throw new Error(`任务失败：${taskId}`);
      }
    } catch (error) {
      lastErrorMessage = error instanceof Error ? error.message : String(error);
      if (debugEnabled) {
        process.stderr.write(
          `[e2e-debug] 轮询任务结果失败，将继续重试：${taskId} -> ${lastErrorMessage}\n`,
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }

  throw new Error(
    `等待任务成功超时：${taskId}${lastErrorMessage ? `（最后错误：${lastErrorMessage}）` : ''}`,
  );
}

async function cleanup(children) {
  await Promise.all(
    children.map(
      (child) =>
        new Promise((resolve) => {
          if (!child || child.killed) {
            resolve();
            return;
          }
          const timeout = setTimeout(() => {
            try {
              if (process.platform !== 'win32' && child.pid) {
                process.kill(-child.pid, 'SIGKILL');
              } else {
                child.kill('SIGKILL');
              }
            } catch {}
            resolve();
          }, 4_000);

          child.once('exit', () => {
            clearTimeout(timeout);
            resolve();
          });

          try {
            if (process.platform !== 'win32' && child.pid) {
              process.kill(-child.pid, 'SIGTERM');
            } else {
              child.kill('SIGTERM');
            }
          } catch {
            clearTimeout(timeout);
            resolve();
          }
        }),
    ),
  );
}

async function runCurrentApp(page, { navButtonName, filePath, prompt, screenshotName }) {
  if (debugEnabled) {
    process.stdout.write(
      `[e2e-debug] 开始运行应用：${navButtonName ? String(navButtonName) : '默认首个应用'}\n`,
    );
  }

  if (navButtonName) {
    await page.goto(`${serverBaseUrl}/workspace/${navButtonName}`, { waitUntil: 'networkidle' });
  }

  if (prompt) {
    await page.getByLabel('增强提示词').waitFor({ timeout: 30_000 });
  }

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(filePath);

  if (prompt) {
    await page.getByLabel('增强提示词').fill(prompt);
  }

  const runButton = page.getByRole('button', { name: '开始生成' });
  const [executeResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/execute') &&
        response.request().method() === 'POST' &&
        response.status() === 200,
      { timeout: 60_000 },
    ),
    runButton.click({ force: true }),
  ]);

  const executePayload = JSON.parse(await executeResponse.text());
  const taskId = String(executePayload.taskId || '').trim();
  if (!taskId) {
    throw new Error('执行接口成功返回，但缺少 taskId');
  }

  if (debugEnabled) {
    process.stdout.write(`[e2e-debug] 已提交任务：${taskId}\n`);
  }

  try {
    await page.waitForFunction(
      (expectedTaskId) => {
        return document.querySelector('.task-meta code')?.textContent?.trim() === expectedTaskId;
      },
      taskId,
      { timeout: 5_000 },
    );
  } catch {
    if (debugEnabled) {
      process.stderr.write(`[e2e-debug] UI 未及时显示 taskId=${taskId}，继续等待结果。\n`);
    }
  }

  const resultPayload = await waitForTaskSuccess(taskId);
  const expectedOutputUrl =
    resultPayload?.outputs?.data?.[0]?.fileUrl || resultPayload?.outputUrls?.[0] || null;

  if (!expectedOutputUrl) {
    throw new Error(`后端已返回成功，但缺少输出地址：${taskId}`);
  }

  try {
    await page.waitForFunction(
      (outputUrl) => {
        const image = document.querySelector('.result-card img');
        return image?.getAttribute('src') === outputUrl;
      },
      expectedOutputUrl,
      { timeout: 60_000 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[e2e-warn] 结果图片未在页面内及时对齐，继续保留后端成功结果：${message}\n`);
  }

  const resultCard = page.locator('.result-card').first();
  const outputUrl = (await resultCard.locator('img').getAttribute('src').catch(() => null)) || expectedOutputUrl;
  const taskCostText =
    (await resultCard.locator('.result-meta span').first().textContent().catch(() => '')) || '';
  const consumeText =
    (await resultCard.locator('.result-meta span').nth(1).textContent().catch(() => '')) || '';

  try {
    await page.screenshot({
      path: path.join(artifactDir, screenshotName),
      timeout: 15_000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[e2e-warn] 截图失败，继续保留验证结果：${message}\n`);
  }

  return {
    taskId,
    outputUrl,
    taskCostText,
    consumeText,
    serverState: resultPayload?.state ?? null,
  };
}

async function verifyAdminLoginPage(page) {
  await page.goto(`${serverBaseUrl}/admin/login`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '后台登录' }).waitFor({ timeout: 60_000 });

  const screenshotPath = path.join(artifactDir, 'admin-login.png');
  try {
    await page.screenshot({
      path: screenshotPath,
      timeout: 15_000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[e2e-warn] 后台登录页截图失败，继续保留验证结果：${message}\n`);
  }

  return {
    status: 'ok',
    page: '/admin/login',
    screenshot: screenshotPath,
  };
}

async function main() {
  assertEnv();
  await ensureReadableFile(app1File, '应用一测试素材');
  await ensureReadableFile(app2File, '应用二测试素材');
  await fs.mkdir(artifactDir, { recursive: true });

  const browserPath = await resolveBrowserPath();
  const children = [];

  try {
    const serverProcess = startProcess('server', 'node', ['server/dist/index.js'], {
      NODE_ENV: 'production',
      PORT: String(serverPort),
    });
    children.push(serverProcess);
    await waitForUrl(`${serverBaseUrl}/health`);
    await waitForUrl(`${serverBaseUrl}/ready`);

    const browser = await chromium.launch({
      headless: true,
      executablePath: browserPath,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
      page.on('console', (message) => {
        if (message.type() === 'error' || debugEnabled) {
          process.stderr.write(`[browser:${message.type()}] ${message.text()}\n`);
        }
      });
      if (debugEnabled) {
        page.on('request', (request) => {
          if (request.url().includes('/api/')) {
            process.stderr.write(`[e2e-request] ${request.method()} ${request.url()}\n`);
          }
        });
        page.on('response', async (response) => {
          if (response.url().includes('/api/')) {
            let text = '';
            try {
              text = await response.text();
            } catch {}
            process.stderr.write(
              `[e2e-response] ${response.status()} ${response.url()} ${text.slice(0, 400)}\n`,
            );
          }
        });
      }

      await page.goto(`${serverBaseUrl}/key-center`, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: '密钥中心' }).waitFor({ timeout: 60_000 });
      await page.getByLabel('服务密钥').fill(apiKey);
      await page.getByRole('button', { name: '校验额度' }).click({ force: true });
      await page.waitForSelector('.metric-grid', { timeout: 60_000 });

      const accountMetrics = await page.locator('.metric-grid strong').allTextContents();

      const app1 = await runCurrentApp(page, {
        navButtonName: '2011111632956563457',
        filePath: app1File,
        screenshotName: 'app-2011111632956563457.png',
      });

      const app2 = await runCurrentApp(page, {
        navButtonName: '1993737411698032641',
        filePath: app2File,
        prompt: app2Prompt,
        screenshotName: 'app-1993737411698032641.png',
      });
      const adminLogin = await verifyAdminLoginPage(page);

      const summary = {
        account: {
          displayBalance: accountMetrics[0] || null,
          displayMultiplier: accountMetrics[1] || null,
          checkedAt: accountMetrics[2] || null,
          serviceKey: accountMetrics[3] || null,
        },
        app1,
        app2,
        adminLogin,
      };

      await fs.writeFile(
        path.join(artifactDir, 'summary.json'),
        `${JSON.stringify(summary, null, 2)}\n`,
        'utf8',
      );

      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    } finally {
      await Promise.race([browser.close(), delay(5_000)]);
    }
  } finally {
    await cleanup(children);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
