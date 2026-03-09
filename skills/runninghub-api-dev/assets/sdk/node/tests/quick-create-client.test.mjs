import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AiAppRunner,
  RunningHubTaskFailure,
  applyNodeOverrides,
} from '../quick-create-client.mjs';

test('应覆盖已有节点且不修改原数组', () => {
  const source = [
    { nodeId: '1', fieldName: 'image', fieldValue: 'a.jpg' },
    { nodeId: '2', fieldName: 'text', fieldValue: 'hello' },
  ];

  const result = applyNodeOverrides(source, {
    '1:image': 'b.jpg',
    '2:text': 'world',
  });

  assert.equal(result[0].fieldValue, 'b.jpg');
  assert.equal(result[1].fieldValue, 'world');
  assert.equal(source[0].fieldValue, 'a.jpg');
});

test('当节点不存在时应抛出异常', () => {
  const source = [{ nodeId: '1', fieldName: 'image', fieldValue: 'a.jpg' }];

  assert.throws(
    () => applyNodeOverrides(source, { '9:image': 'b.jpg' }),
    /未找到这些节点键/u,
  );
});

test('应基于 demo 构造运行载荷', async () => {
  const client = {
    apiKey: 'demo-key',
    async getAiAppDemo() {
      return {
        data: {
          nodeInfoList: [
            { nodeId: '1', fieldName: 'image', fieldValue: 'old.png' },
            { nodeId: '2', fieldName: 'text', fieldValue: 'old text' },
          ],
        },
      };
    },
  };

  const runner = new AiAppRunner(client);
  const payload = await runner.preparePayload('123', {
    nodeOverrides: { '1:image': 'new.png', '2:text': 'new text' },
    instanceType: 'plus',
    webhookUrl: 'https://example.com/hook',
  });

  assert.equal(payload.webappId, '123');
  assert.equal(payload.apiKey, 'demo-key');
  assert.equal(payload.instanceType, 'plus');
  assert.equal(payload.webhookUrl, 'https://example.com/hook');
  assert.equal(payload.nodeInfoList[0].fieldValue, 'new.png');
});

test('轮询完成后应返回成功结果', async () => {
  const calls = [];
  const client = {
    async queryStatus(taskId) {
      calls.push(`status:${taskId}`);
      return { code: 0, data: { status: 'RUNNING' } };
    },
    async queryOutputs(taskId) {
      calls.push(`outputs:${taskId}`);
      return { code: 0, data: [{ fileUrl: 'https://example.com/out.png' }] };
    },
  };

  const runner = new AiAppRunner(client);
  const result = await runner.waitForCompletion('42', {
    pollIntervalMs: 1,
    timeoutMs: 100,
  });

  assert.equal(result.taskId, '42');
  assert.equal(result.finalState, 'SUCCESS');
  assert.match(calls.join(','), /status:42,outputs:42/u);
});

test('查询到明确失败码时应抛出任务异常', async () => {
  const client = {
    async queryStatus() {
      return { code: 0, data: { status: 'FAILED' } };
    },
    async queryOutputs() {
      return { code: 805, msg: 'FAILED' };
    },
  };

  const runner = new AiAppRunner(client);

  await assert.rejects(
    () => runner.waitForCompletion('42', {
      pollIntervalMs: 1,
      timeoutMs: 100,
    }),
    RunningHubTaskFailure,
  );
});
