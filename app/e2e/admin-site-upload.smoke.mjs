import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactRoot = path.join(
  appRoot,
  'e2e',
  'artifacts',
  `admin-site-upload-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);

const clientBaseUrl = process.env.RUNNINGHUB_SMOKE_CLIENT_URL || 'http://127.0.0.1:5173';
const serverBaseUrl = process.env.RUNNINGHUB_SMOKE_SERVER_URL || 'http://127.0.0.1:8787';
const adminUsername = process.env.RUNNINGHUB_ADMIN_USERNAME || 'admin';
const adminPassword = process.env.RUNNINGHUB_ADMIN_PASSWORD || 'admin123456';
const browserCandidates = [
  process.env.RUNNINGHUB_E2E_BROWSER_PATH,
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
].filter(Boolean);

async function ensureHttpOk(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`服务不可用：${url} -> ${response.status}`);
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
    '未找到可用浏览器，请设置 RUNNINGHUB_E2E_BROWSER_PATH，例如 /usr/bin/google-chrome-stable',
  );
}

async function createTempUploadFile() {
  const tempFilePath = path.join(os.tmpdir(), 'runninghub-admin-site-upload-smoke.png');
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGP8z4AdMOEQH6QSAM1BAQ/oQeJvAAAAAElFTkSuQmCC';
  await fs.writeFile(tempFilePath, Buffer.from(pngBase64, 'base64'));
  return tempFilePath;
}

async function main() {
  await fs.mkdir(artifactRoot, { recursive: true });
  await ensureHttpOk(`${serverBaseUrl}/health`);
  await ensureHttpOk(clientBaseUrl);

  const browserPath = await resolveBrowserPath();
  const uploadFilePath = await createTempUploadFile();
  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1024 },
  });

  try {
    await page.goto(`${clientBaseUrl}/admin/login`, { waitUntil: 'networkidle' });
    await page.getByLabel('用户名').fill(adminUsername);
    await page.getByLabel('密码').fill(adminPassword);
    await page.getByRole('button', { name: '登录后台' }).click();

    await page.waitForURL(
      (url) => url.pathname === '/admin/apps' || url.pathname === '/admin/dashboard',
      { timeout: 15_000 },
    );

    await page.goto(`${clientBaseUrl}/admin/site`, { waitUntil: 'networkidle' });
    await page.locator('#reference-upload-0').setInputFiles(uploadFilePath);

    await page.waitForFunction(() => {
      const input = document.querySelector('#reference-image-0');
      return Boolean(
        input &&
          'value' in input &&
          typeof input.value === 'string' &&
          input.value.includes('/site-assets/'),
      );
    });

    const uploadedUrl = await page.locator('#reference-image-0').inputValue();
    await page.getByRole('button', { name: '保存站点内容' }).click();
    await page.getByText('站点配置已保存').waitFor({ timeout: 15_000 });
    await page.screenshot({
      path: path.join(artifactRoot, 'admin-site-after-upload.png'),
      fullPage: true,
    });

    await page.goto(clientBaseUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(
      (targetUrl) => {
        const images = Array.from(document.querySelectorAll('.reference-card-media img'));
        return images.some((image) => {
          const currentSrc = image.getAttribute('src') || '';
          return currentSrc.includes('/site-assets/') && currentSrc.includes(targetUrl.split('/site-assets/')[1] || '');
        });
      },
      uploadedUrl,
      { timeout: 15_000 },
    );
    await page.screenshot({
      path: path.join(artifactRoot, 'home-reference-gallery.png'),
      fullPage: true,
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          artifactRoot,
          uploadedUrl,
          clientBaseUrl,
          serverBaseUrl,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
    await fs.rm(uploadFilePath, { force: true });
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
        clientBaseUrl,
        serverBaseUrl,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
