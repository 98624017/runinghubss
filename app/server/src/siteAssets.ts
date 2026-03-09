import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import express from 'express';

function resolveWorkspaceRoot() {
  let currentPath = process.cwd();

  for (let depth = 0; depth < 5; depth += 1) {
    if (
      fs.existsSync(path.join(currentPath, 'docker-compose.yml')) &&
      fs.existsSync(path.join(currentPath, 'app'))
    ) {
      return currentPath;
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      break;
    }
    currentPath = parentPath;
  }

  return process.cwd();
}

export function resolveSiteAssetsRoot() {
  return path.join(resolveWorkspaceRoot(), 'output', 'site-assets');
}

export function ensureSiteAssetsRoot() {
  const targetPath = resolveSiteAssetsRoot();
  fs.mkdirSync(targetPath, { recursive: true });
  return targetPath;
}

function sanitizeFileStem(filename: string) {
  return filename
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function normalizeExtension(filename: string, mimeType: string) {
  const extension = path.extname(filename).toLowerCase();
  if (extension) {
    return extension;
  }

  if (mimeType === 'image/png') {
    return '.png';
  }
  if (mimeType === 'image/jpeg') {
    return '.jpg';
  }
  if (mimeType === 'image/webp') {
    return '.webp';
  }
  if (mimeType === 'image/svg+xml') {
    return '.svg';
  }

  return '.bin';
}

export function saveSiteAsset(file: Pick<Express.Multer.File, 'buffer' | 'originalname' | 'mimetype'>) {
  const assetRoot = ensureSiteAssetsRoot();
  const fileStem = sanitizeFileStem(file.originalname) || 'site-reference';
  const extension = normalizeExtension(file.originalname, file.mimetype);
  const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${fileStem}${extension}`;
  const absolutePath = path.join(assetRoot, fileName);

  fs.writeFileSync(absolutePath, file.buffer);

  return {
    fileName,
    absolutePath,
    publicPath: `/site-assets/${fileName}`,
  };
}

export function buildSiteAssetUrl(request: express.Request, publicPath: string) {
  const host = request.get('host');
  if (!host) {
    return publicPath;
  }

  return `${request.protocol}://${host}${publicPath}`;
}

export function registerSiteAssetRoutes(app: express.Express) {
  app.use('/site-assets', express.static(ensureSiteAssetsRoot(), { index: false }));
}
