import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../app.js';

function createMockClient() {
  return {
    checkAccount: vi.fn(async () => ({ code: 0, data: { remainCoins: '100' } })),
    uploadFile: vi.fn(async () => ({ code: 0, data: { fileName: 'openapi/demo.png' } })),
    runAiApp: vi.fn(async () => ({ code: 0, data: { taskId: '42' } })),
    queryStatus: vi.fn(async () => ({ code: 0, data: { status: 'RUNNING' } })),
    queryOutputs: vi.fn(async () => ({ code: 804, data: null })),
  };
}

describe('routes', () => {
  it('应提供根级 health 与 ready 检查', async () => {
    const app = createApp(createMockClient() as any);

    const healthResponse = await request(app).get('/health');
    const readyResponse = await request(app).get('/ready');
    const apiHealthResponse = await request(app).get('/api/health');

    expect(healthResponse.status).toBe(200);
    expect(healthResponse.body).toEqual({
      ok: true,
      service: 'ai-console',
    });
    expect(apiHealthResponse.status).toBe(200);
    expect(apiHealthResponse.body).toEqual({
      ok: true,
      service: 'ai-console',
    });
    expect(readyResponse.status).toBe(200);
    expect(readyResponse.body).toEqual(
      expect.objectContaining({
        ok: true,
        ready: true,
        checks: expect.objectContaining({
          database: 'skipped',
        }),
      }),
    );
  });

  it('应在提供静态产物目录时托管前端资源并支持 SPA 回退', async () => {
    const staticRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-console-static-'));
    await fs.mkdir(path.join(staticRoot, 'assets'));
    await fs.writeFile(path.join(staticRoot, 'index.html'), '<!doctype html><html><body>white-label-app</body></html>');
    await fs.writeFile(path.join(staticRoot, 'assets', 'app.js'), 'console.log("ready");');

    const app = createApp(createMockClient() as any, {
      staticRoot,
    });

    try {
      const indexResponse = await request(app).get('/');
      const historyResponse = await request(app).get('/history');
      const assetResponse = await request(app).get('/assets/app.js');
      const readyResponse = await request(app).get('/ready');

      expect(indexResponse.status).toBe(200);
      expect(indexResponse.text).toContain('white-label-app');
      expect(historyResponse.status).toBe(200);
      expect(historyResponse.text).toContain('white-label-app');
      expect(assetResponse.status).toBe(200);
      expect(assetResponse.text).toContain('console.log("ready")');
      expect(readyResponse.status).toBe(200);
      expect(readyResponse.body.checks.staticAssets).toBe('ready');
    } finally {
      await fs.rm(staticRoot, { recursive: true, force: true });
    }
  });

  it('应支持获取动态应用清单', async () => {
    const client = createMockClient();
    const app = createApp(client as any);

    const response = await request(app).get('/api/apps');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.apps).toHaveLength(4);
    expect(response.body.apps.map((item: { id: string }) => item.id)).toEqual([
      '1994388299756212225',
      '1986819253754130433',
      '2003678561775067138',
      '2023563076041183233',
    ]);
    expect(response.body.apps[0]).toEqual(
      expect.objectContaining({
        id: '1994388299756212225',
        slug: 'color-plan',
        title: '一键彩平',
        shortTitle: '一键彩平',
        description: expect.any(String),
        chips: expect.any(Array),
        notes: expect.any(Array),
        nodeSummary: expect.any(Array),
        fields: expect.any(Array),
      }),
    );
    expect(response.body.apps[0].fields.map((field: { key: string }) => field.key)).toEqual([
      'file',
      'prompt',
      'width',
      'height',
    ]);
    expect(response.body.apps[1]).toEqual(
      expect.objectContaining({
        id: '1986819253754130433',
        slug: 'exterior-transfer',
        title: '外观迁移',
      }),
    );
    expect(response.body.apps[1].fields.map((field: { key: string }) => field.key)).toEqual([
      'sourceImage',
      'styleImage',
    ]);
    expect(response.body.apps[2]).toEqual(
      expect.objectContaining({
        id: '2003678561775067138',
        slug: 'floorplan-to-render',
        title: '平面转效果',
      }),
    );
    expect(response.body.apps[2].fields.map((field: { key: string }) => field.key)).toEqual([
      'prompt',
      'planImage',
      'sofaReference',
      'ceilingReference',
      'tvWallReference',
      'chandelierReference',
      'windowReference',
      'floorReference',
      'wallReference',
      'plantReference',
    ]);
    expect(response.body.apps[3]).toEqual(
      expect.objectContaining({
        id: '2023563076041183233',
        slug: 'rough-to-render',
        title: '毛坯转效果',
      }),
    );
    expect(response.body.apps[3].fields.map((field: { key: string }) => field.key)).toEqual([
      'sourceImage',
      'styleImage',
      'prompt',
      'aspectRatio',
      'resolution',
      'channel',
    ]);
  });

  it('应支持账户检查', async () => {
    const client = createMockClient();
    const app = createApp(client as any);

    const response = await request(app).post('/api/account/check').send({ apiKey: 'demo-key' });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('应支持执行应用任务', async () => {
    const client = createMockClient();
    const app = createApp(client as any);

    const response = await request(app)
      .post('/api/apps/2011111632956563457/execute')
      .field('apiKey', 'demo-key')
      .field('enable8k', 'true')
      .attach('file', Buffer.from('hello'), 'demo.png');

    expect(response.status).toBe(200);
    expect(response.body.taskId).toBe('42');
    expect(client.runAiApp).toHaveBeenCalledTimes(1);
    expect(client.runAiApp).toHaveBeenCalledWith(
      'demo-key',
      expect.objectContaining({
        webappId: '2011111632956563457',
        nodeInfoList: expect.arrayContaining([
          expect.objectContaining({
            nodeId: '308',
            fieldName: 'image',
            fieldValue: 'openapi/demo.png',
          }),
          expect.objectContaining({
            nodeId: '306',
            fieldName: 'value',
            fieldValue: 'true',
          }),
        ]),
      }),
    );
  });

  it('应支持按字段定义解析文本输入后执行应用任务', async () => {
    const client = createMockClient();
    const app = createApp(client as any);

    const response = await request(app)
      .post('/api/apps/1993737411698032641/execute')
      .field('apiKey', 'demo-key')
      .field('prompt', '修复人像细节')
      .attach('file', Buffer.from('hello'), 'demo.png');

    expect(response.status).toBe(200);
    expect(response.body.taskId).toBe('42');
    expect(client.runAiApp).toHaveBeenCalledWith(
      'demo-key',
      expect.objectContaining({
        webappId: '1993737411698032641',
        nodeInfoList: expect.arrayContaining([
          expect.objectContaining({
            nodeId: '22',
            fieldName: 'image',
            fieldValue: 'openapi/demo.png',
          }),
          expect.objectContaining({
            nodeId: '43',
            fieldName: 'text',
            fieldValue: '修复人像细节',
          }),
        ]),
      }),
    );
  });

  it('应支持执行单图加文本尺寸字段的应用任务', async () => {
    const client = createMockClient();
    const app = createApp(client as any);

    const response = await request(app)
      .post('/api/apps/1994388299756212225/execute')
      .field('apiKey', 'demo-key')
      .field('prompt', '现代暖木色住宅效果图')
      .field('width', '1600')
      .field('height', '1600')
      .attach('file', Buffer.from('floorplan'), 'floorplan.jpg');

    expect(response.status).toBe(200);
    expect(client.runAiApp).toHaveBeenCalledWith(
      'demo-key',
      expect.objectContaining({
        webappId: '1994388299756212225',
        nodeInfoList: expect.arrayContaining([
          expect.objectContaining({
            nodeId: '257',
            fieldName: 'image',
            fieldValue: 'openapi/demo.png',
          }),
          expect.objectContaining({
            nodeId: '253',
            fieldName: 'text',
            fieldValue: '现代暖木色住宅效果图',
          }),
          expect.objectContaining({
            nodeId: '260',
            fieldName: 'width',
            fieldValue: '1600',
          }),
          expect.objectContaining({
            nodeId: '260',
            fieldName: 'height',
            fieldValue: '1600',
          }),
        ]),
      }),
    );
  });

  it('应支持执行双图风格迁移应用任务', async () => {
    const client = createMockClient();
    client.uploadFile = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/original.png' } })
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/style.png' } });
    const app = createApp(client as any);

    const response = await request(app)
      .post('/api/apps/1986819253754130433/execute')
      .field('apiKey', 'demo-key')
      .attach('sourceImage', Buffer.from('original'), 'original.png')
      .attach('styleImage', Buffer.from('style'), 'style.png');

    expect(response.status).toBe(200);
    expect(client.uploadFile).toHaveBeenCalledTimes(2);
    expect(client.runAiApp).toHaveBeenCalledWith(
      'demo-key',
      expect.objectContaining({
        webappId: '1986819253754130433',
        nodeInfoList: [
          expect.objectContaining({
            nodeId: '1',
            fieldName: 'image',
            fieldValue: 'openapi/original.png',
          }),
          expect.objectContaining({
            nodeId: '403',
            fieldName: 'image',
            fieldValue: 'openapi/style.png',
          }),
        ],
      }),
    );
  });

  it('应支持执行平面转效果多图应用任务', async () => {
    const client = createMockClient();
    client.uploadFile = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/plan.png' } })
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/sofa.png' } })
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/ceiling.png' } })
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/tv-wall.png' } })
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/chandelier.png' } })
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/window.png' } })
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/floor.png' } })
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/wall.png' } })
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/plant.png' } });
    const app = createApp(client as any);

    const response = await request(app)
      .post('/api/apps/2003678561775067138/execute')
      .field('apiKey', 'demo-key')
      .field('prompt', '根据平面图生成现代客厅效果图，融合全部参考素材。')
      .attach('planImage', Buffer.from('plan'), 'plan.png')
      .attach('sofaReference', Buffer.from('sofa'), 'sofa.png')
      .attach('ceilingReference', Buffer.from('ceiling'), 'ceiling.png')
      .attach('tvWallReference', Buffer.from('tv-wall'), 'tv-wall.png')
      .attach('chandelierReference', Buffer.from('chandelier'), 'chandelier.png')
      .attach('windowReference', Buffer.from('window'), 'window.png')
      .attach('floorReference', Buffer.from('floor'), 'floor.png')
      .attach('wallReference', Buffer.from('wall'), 'wall.png')
      .attach('plantReference', Buffer.from('plant'), 'plant.png');

    expect(response.status).toBe(200);
    expect(client.uploadFile).toHaveBeenCalledTimes(9);
    expect(client.runAiApp).toHaveBeenCalledWith(
      'demo-key',
      expect.objectContaining({
        webappId: '2003678561775067138',
        nodeInfoList: [
          expect.objectContaining({
            nodeId: '2',
            fieldName: 'prompt',
            fieldValue: '根据平面图生成现代客厅效果图，融合全部参考素材。',
          }),
          expect.objectContaining({
            nodeId: '3',
            fieldName: 'image',
            fieldValue: 'openapi/plan.png',
          }),
          expect.objectContaining({
            nodeId: '7',
            fieldName: 'image',
            fieldValue: 'openapi/sofa.png',
          }),
          expect.objectContaining({
            nodeId: '8',
            fieldName: 'image',
            fieldValue: 'openapi/ceiling.png',
          }),
          expect.objectContaining({
            nodeId: '11',
            fieldName: 'image',
            fieldValue: 'openapi/tv-wall.png',
          }),
          expect.objectContaining({
            nodeId: '12',
            fieldName: 'image',
            fieldValue: 'openapi/chandelier.png',
          }),
          expect.objectContaining({
            nodeId: '13',
            fieldName: 'image',
            fieldValue: 'openapi/window.png',
          }),
          expect.objectContaining({
            nodeId: '14',
            fieldName: 'image',
            fieldValue: 'openapi/floor.png',
          }),
          expect.objectContaining({
            nodeId: '15',
            fieldName: 'image',
            fieldValue: 'openapi/wall.png',
          }),
          expect.objectContaining({
            nodeId: '18',
            fieldName: 'image',
            fieldValue: 'openapi/plant.png',
          }),
        ],
      }),
    );
  });

  it('应支持执行毛坯转效果应用任务并传递设置参数', async () => {
    const client = createMockClient();
    client.uploadFile = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/rough-room.png' } })
      .mockResolvedValueOnce({ code: 0, data: { fileName: 'openapi/style-reference.png' } });
    const app = createApp(client as any);

    const response = await request(app)
      .post('/api/apps/2023563076041183233/execute')
      .field('apiKey', 'demo-key')
      .field('prompt', '现代奶油风客厅，保留原始结构，增加收纳与氛围灯光。')
      .field('aspectRatio', '16:9')
      .field('resolution', '4k')
      .field('channel', 'Official')
      .attach('sourceImage', Buffer.from('rough'), 'rough-room.png')
      .attach('styleImage', Buffer.from('style'), 'style-reference.png');

    expect(response.status).toBe(200);
    expect(client.uploadFile).toHaveBeenCalledTimes(2);
    expect(client.runAiApp).toHaveBeenCalledWith(
      'demo-key',
      expect.objectContaining({
        webappId: '2023563076041183233',
        nodeInfoList: [
          expect.objectContaining({
            nodeId: '541',
            fieldName: 'image',
            fieldValue: 'openapi/rough-room.png',
          }),
          expect.objectContaining({
            nodeId: '538',
            fieldName: 'image',
            fieldValue: 'openapi/style-reference.png',
          }),
          expect.objectContaining({
            nodeId: '558',
            fieldName: 'text',
            fieldValue: '现代奶油风客厅，保留原始结构，增加收纳与氛围灯光。',
          }),
          expect.objectContaining({
            nodeId: '605',
            fieldName: 'aspectRatio',
            fieldValue: '16:9',
          }),
          expect.objectContaining({
            nodeId: '605',
            fieldName: 'resolution',
            fieldValue: '4k',
          }),
          expect.objectContaining({
            nodeId: '605',
            fieldName: 'channel',
            fieldValue: 'Official',
          }),
        ],
      }),
    );
  });

  it('执行应用缺少文件时应返回 400', async () => {
    const client = createMockClient();
    const app = createApp(client as any);

    const response = await request(app)
      .post('/api/apps/2011111632956563457/execute')
      .field('apiKey', 'demo-key');

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/缺少上传图片/u);
  });

  it('应支持查询任务状态', async () => {
    const client = createMockClient();
    const app = createApp(client as any);

    const response = await request(app)
      .get('/api/tasks/42/status')
      .set('x-runninghub-api-key', 'demo-key');

    expect(response.status).toBe(200);
    expect(response.body.taskId).toBe('42');
    expect(response.body.state).toBe('running');
  });

  it('任务状态接口缺少服务密钥时应返回白牌提示', async () => {
    const client = createMockClient();
    const app = createApp(client as any);

    const response = await request(app).get('/api/tasks/42/status');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('缺少服务密钥');
  });

  it('应将 RunningHub 字符串状态归一化为 running', async () => {
    const client = createMockClient();
    client.queryStatus = vi.fn(async () => ({ code: 0, data: 'RUNNING' }));
    client.queryOutputs = vi.fn(async () => ({ code: 804, msg: 'APIKEY_TASK_IS_RUNNING', data: null }));
    const app = createApp(client as any);

    const response = await request(app)
      .get('/api/tasks/42/status')
      .set('x-runninghub-api-key', 'demo-key');

    expect(response.status).toBe(200);
    expect(response.body.state).toBe('running');
    expect(response.body.message).toBe('APIKEY_TASK_IS_RUNNING');
  });

  it('应支持查询任务结果', async () => {
    const client = createMockClient();
    client.queryOutputs = vi.fn(async () => ({ code: 0, data: [{ fileUrl: 'https://example.com/result.png' }] }));
    const app = createApp(client as any);

    const response = await request(app)
      .get('/api/tasks/42/result')
      .set('x-runninghub-api-key', 'demo-key');

    expect(response.status).toBe(200);
    expect(response.body.state).toBe('succeeded');
  });

  it('应从字符串 taskCostTime 中提取数值耗时', async () => {
    const client = createMockClient();
    client.queryOutputs = vi.fn(async () => ({
      code: 0,
      data: [
        {
          fileUrl: 'https://example.com/result.png',
          taskCostTime: '101',
        },
      ],
    }));
    const app = createApp(client as any);

    const response = await request(app)
      .get('/api/tasks/42/result')
      .set('x-runninghub-api-key', 'demo-key');

    expect(response.status).toBe(200);
    expect(response.body.state).toBe('succeeded');
    expect(response.body.taskCostTime).toBe(101);
  });

  it('任务不存在时状态接口应返回 failed 和错误消息', async () => {
    const client = createMockClient();
    client.queryStatus = vi.fn(async () => ({ code: 807, msg: 'APIKEY_TASK_NOT_FOUND', data: null }));
    client.queryOutputs = vi.fn(async () => ({ code: 807, msg: 'APIKEY_TASK_NOT_FOUND', data: null }));
    const app = createApp(client as any);

    const response = await request(app)
      .get('/api/tasks/999/status')
      .set('x-runninghub-api-key', 'demo-key');

    expect(response.status).toBe(200);
    expect(response.body.state).toBe('failed');
    expect(response.body.message).toBe('APIKEY_TASK_NOT_FOUND');
  });

  it('账户检查失败时不应向前台暴露上游品牌词', async () => {
    const client = createMockClient();
    client.checkAccount = vi.fn(async () => {
      throw new Error('RunningHub HTTP 失败：502 demo-key');
    });
    const app = createApp(client as any);

    const response = await request(app).post('/api/account/check').send({
      apiKey: 'demo-key',
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('上游服务 HTTP 失败：502 <SERVICE_API_KEY>');
  });
});
