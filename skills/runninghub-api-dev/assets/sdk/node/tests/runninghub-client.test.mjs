import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { RunningHubClient, maskApiKey } from '../runninghub-client.mjs';

test('应生成默认请求头', () => {
  const client = new RunningHubClient({ apiKey: '1234567890abcdef' });
  const headers = client.buildHeaders();

  assert.equal(headers.Host, 'www.runninghub.cn');
  assert.match(headers.Authorization, /^Bearer /u);
  assert.equal(headers['Content-Type'], 'application/json');
});

test('应对 api key 打码', () => {
  const masked = maskApiKey('1234567890abcdef');
  assert.equal(masked.slice(0, 4), '1234');
  assert.equal(masked.slice(-4), 'cdef');
  assert.match(masked, /\*/u);
});

test('应请求账户检查接口', async () => {
  const requests = [];
  const client = new RunningHubClient({
    apiKey: 'demo-key',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return {
        status: 200,
        async text() {
          return JSON.stringify({ code: 0, data: { balance: '1.00' } });
        },
      };
    },
  });

  const payload = await client.checkAccount();

  assert.equal(payload.code, 0);
  assert.equal(requests[0].url, 'https://www.runninghub.cn/uc/openapi/accountStatus');
  assert.equal(requests[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].init.body), { apikey: 'demo-key' });
});

test('应请求 AI 应用 demo 接口', async () => {
  const requests = [];
  const client = new RunningHubClient({
    apiKey: 'demo-key',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return {
        status: 200,
        async text() {
          return JSON.stringify({ code: 0, data: { webappName: 'demo' } });
        },
      };
    },
  });

  const payload = await client.getAiAppDemo('123');

  assert.equal(payload.data.webappName, 'demo');
  assert.equal(
    requests[0].url,
    'https://www.runninghub.cn/api/webapp/apiCallDemo?apiKey=demo-key&webappId=123',
  );
  assert.equal(requests[0].init.method, 'GET');
});

test('应上传二进制文件', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'runninghub-node-sdk-'));
  const filePath = join(tempDir, 'demo.txt');
  await writeFile(filePath, 'hello');

  const requests = [];
  const client = new RunningHubClient({
    apiKey: 'demo-key',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return {
        status: 200,
        async text() {
          return JSON.stringify({ code: 0, data: { fileName: 'openapi/demo.txt' } });
        },
      };
    },
  });

  const payload = await client.uploadFile(filePath);

  assert.equal(payload.data.fileName, 'openapi/demo.txt');
  assert.equal(requests[0].url, 'https://www.runninghub.cn/openapi/v2/media/upload/binary');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer demo-key');
  assert.ok(requests[0].init.body instanceof FormData);
  assert.equal(requests[0].init.headers['Content-Type'], undefined);
});

test('应发起 AI 应用任务', async () => {
  const requests = [];
  const client = new RunningHubClient({
    apiKey: 'demo-key',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return {
        status: 200,
        async text() {
          return JSON.stringify({ code: 0, data: { taskId: '42' } });
        },
      };
    },
  });

  const payload = await client.runAiApp({
    webappId: '123',
    nodeInfoList: [{ nodeId: '1', fieldName: 'prompt', fieldValue: 'hello' }],
    instanceType: 'plus',
  });

  assert.equal(payload.data.taskId, '42');
  assert.equal(requests[0].url, 'https://www.runninghub.cn/task/openapi/ai-app/run');
  assert.equal(requests[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    webappId: '123',
    apiKey: 'demo-key',
    nodeInfoList: [{ nodeId: '1', fieldName: 'prompt', fieldValue: 'hello' }],
    instanceType: 'plus',
  });
});

test('应查询状态、结果与 V2 结果', async () => {
  const requests = [];
  const client = new RunningHubClient({
    apiKey: 'demo-key',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return {
        status: 200,
        async text() {
          return JSON.stringify({ code: 0, data: { ok: true } });
        },
      };
    },
  });

  await client.queryStatus('11');
  await client.queryOutputs('11');
  await client.queryV2('11');

  assert.equal(requests[0].url, 'https://www.runninghub.cn/task/openapi/status');
  assert.equal(requests[1].url, 'https://www.runninghub.cn/task/openapi/outputs');
  assert.equal(requests[2].url, 'https://www.runninghub.cn/openapi/v2/query');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    taskId: '11',
    apiKey: 'demo-key',
  });
  assert.deepEqual(JSON.parse(requests[1].init.body), {
    taskId: '11',
    apiKey: 'demo-key',
  });
  assert.deepEqual(JSON.parse(requests[2].init.body), {
    taskId: '11',
  });
});
