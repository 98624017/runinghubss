import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function hasIndexFile(targetPath: string) {
  return fs.existsSync(path.join(targetPath, 'index.html'));
}

export function resolveStaticAssetRoot(explicitRoot?: string | null) {
  const candidates = [
    explicitRoot ?? null,
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(__dirname, '../../client/dist'),
  ].filter((item): item is string => Boolean(item));

  return candidates.find((candidate) => hasIndexFile(candidate)) ?? null;
}

export function registerStaticAssets(app: express.Express, staticRoot: string) {
  const indexFile = path.join(staticRoot, 'index.html');

  app.use(express.static(staticRoot, { index: false }));

  app.use((req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      next();
      return;
    }

    if (req.path.startsWith('/api/')) {
      next();
      return;
    }

    if (path.extname(req.path)) {
      next();
      return;
    }

    res.sendFile(indexFile, (error) => {
      if (error) {
        next(error);
      }
    });
  });
}
