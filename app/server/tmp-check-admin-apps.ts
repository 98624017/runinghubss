import request from 'supertest';

import { createApp } from './src/app.js';
import { createTestDatabase } from './src/db/testDatabase.js';

async function main() {
  const env = {
    port: 8787,
    databaseUrl: 'postgres://demo:demo@127.0.0.1:5432/runninghub',
    adminPath: '/admin-console',
    adminDefaultUsername: 'admin',
    adminDefaultPassword: 'change-me',
    sessionSecret: 'session-secret',
    nodeEnv: 'test',
  } as const;

  const client = {
    checkAccount: async () => ({ code: 0, data: { remainCoins: '100' } }),
    uploadFile: async () => ({ code: 0, data: { fileName: 'openapi/demo.png' } }),
    runAiApp: async () => ({ code: 0, data: { taskId: '42' } }),
    queryStatus: async () => ({ code: 0, data: { status: 'RUNNING' } }),
    queryOutputs: async () => ({ code: 804, data: null }),
  };

  const database = await createTestDatabase();
  try {
    const app = createApp(client as any, { env, pool: database.pool as any });
    const loginResponse = await request(app).post('/api/admin/auth/login').send({ username: 'admin', password: 'change-me' });
    const cookie = loginResponse.headers['set-cookie']?.[0] ?? '';
    console.log('login', loginResponse.status, loginResponse.body);

    const createResponse = await request(app)
      .post('/api/admin/apps')
      .set('Cookie', cookie)
      .send({
        slug: 'one-click-color',
        displayName: '一键彩平',
        subtitle: '快速生成彩平图',
        description: '将平面线稿转换为彩平效果图。',
        coverImageUrl: 'https://example.com/cover.png',
        tags: ['彩平', '室内设计'],
        sortOrder: 10,
        isEnabled: true,
        usageTips: ['建议上传清晰平面图'],
        resultTips: ['结果链接可能失效，请及时下载'],
        upstreamAppId: '1994388299756212225',
        instanceType: 'default',
        usePersonalQueue: false,
        pollIntervalMs: 5000,
        maxPollAttempts: 60,
        timeoutSeconds: 600,
        maxConcurrencyPerKey: 2,
      });

    console.log('create', createResponse.status, createResponse.body);
    const appId = createResponse.body.app.id;

    const schemaResponse = await request(app)
      .post(`/api/admin/apps/${appId}/schema`)
      .set('Cookie', cookie)
      .send({
        schemaVersion: 1,
        layoutSchema: { sections: [{ key: 'inputs', title: '输入区' }] },
        fieldSchema: { fields: [{ key: 'file', label: '上传平面图', type: 'file', description: '上传待处理素材', required: true, accept: 'image/*', nodeId: '257', fieldName: 'image' }] },
        resultSchema: { sections: [{ key: 'results', title: '结果区' }] },
        isPublished: true,
      });

    console.log('schema', schemaResponse.status, schemaResponse.body);
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
