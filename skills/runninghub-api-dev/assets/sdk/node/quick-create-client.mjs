import { RunningHubApiError } from './runninghub-client.mjs';

export class RunningHubTaskFailure extends Error {
  constructor(taskId, response) {
    const code = response?.code;
    const msg = response?.msg ?? response?.message;
    super(`任务 ${taskId} 执行失败 | code=${code} msg=${msg}`);
    this.name = 'RunningHubTaskFailure';
    this.taskId = taskId;
    this.response = response;
  }
}

export function nodeLookupKey(node) {
  return `${node?.nodeId}:${node?.fieldName}`;
}

export function cloneNodes(nodeInfoList) {
  return structuredClone(nodeInfoList);
}

export function applyNodeOverrides(nodeInfoList, overrides) {
  const nodes = cloneNodes(nodeInfoList);
  const index = new Map(nodes.map((node) => [nodeLookupKey(node), node]));
  const missingKeys = [];

  for (const [key, value] of Object.entries(overrides)) {
    const target = index.get(key);
    if (!target) {
      missingKeys.push(key);
      continue;
    }
    target.fieldValue = value;
  }

  if (missingKeys.length) {
    throw new Error(`未找到这些节点键：${missingKeys.join(', ')}`);
  }
  return nodes;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class AiAppRunner {
  constructor(client) {
    this.client = client;
  }

  async getDemoNodes(webappId) {
    const demo = await this.client.getAiAppDemo(webappId);
    const data = demo?.data ?? {};
    const nodeInfoList = data.nodeInfoList ?? [];
    if (!Array.isArray(nodeInfoList) || nodeInfoList.length === 0) {
      throw new RunningHubApiError('AI 应用 demo 未返回 nodeInfoList', {
        response: demo,
      });
    }
    return { demo, nodeInfoList };
  }

  async preparePayload(
    webappId,
    {
      nodeOverrides,
      instanceType = undefined,
      webhookUrl = undefined,
    },
  ) {
    const { demo, nodeInfoList } = await this.getDemoNodes(webappId);
    const nodes = applyNodeOverrides(nodeInfoList, nodeOverrides);
    const payload = {
      webappId: String(webappId),
      apiKey: this.client.apiKey,
      nodeInfoList: nodes,
      demo,
    };
    if (instanceType) {
      payload.instanceType = instanceType;
    }
    if (webhookUrl) {
      payload.webhookUrl = webhookUrl;
    }
    return payload;
  }

  async submitPayload(payload) {
    return this.client.runAiApp({
      webappId: payload.webappId,
      nodeInfoList: payload.nodeInfoList,
      webhookUrl: payload.webhookUrl,
      instanceType: payload.instanceType,
    });
  }

  async waitForCompletion(
    taskId,
    {
      pollIntervalMs = 12_000,
      timeoutMs = 1_800_000,
    } = {},
  ) {
    const taskIdText = String(taskId);
    const deadline = Date.now() + timeoutMs;
    let lastStatus = null;
    let lastOutputs = null;

    while (Date.now() < deadline) {
      lastStatus = await this.client.queryStatus(taskIdText);
      lastOutputs = await this.client.queryOutputs(taskIdText);

      const outputCode = lastOutputs?.code;
      if (outputCode === 0 && lastOutputs?.data) {
        return {
          taskId: taskIdText,
          status: lastStatus,
          outputs: lastOutputs,
          finalState: 'SUCCESS',
        };
      }

      if (outputCode === 805) {
        throw new RunningHubTaskFailure(taskIdText, lastOutputs);
      }

      if (outputCode === 804 || outputCode === 813) {
        await delay(pollIntervalMs);
        continue;
      }

      if (![0, 804, 805, 813].includes(outputCode)) {
        if (typeof this.client.queryV2 === 'function') {
          const v2Payload = await this.client.queryV2(taskIdText);
          if (Array.isArray(v2Payload?.results) && v2Payload.results.length > 0) {
            return {
              taskId: taskIdText,
              status: lastStatus,
              outputs: lastOutputs,
              v2: v2Payload,
              finalState: 'SUCCESS_V2',
            };
          }
          if (![null, undefined, '', '0'].includes(v2Payload?.errorCode)) {
            throw new RunningHubTaskFailure(taskIdText, v2Payload);
          }
        }
        await delay(pollIntervalMs);
        continue;
      }

      await delay(pollIntervalMs);
    }

    throw new Error(
      `任务 ${taskIdText} 在 ${timeoutMs} 毫秒内未完成。最后状态：${JSON.stringify(lastStatus)} / ${JSON.stringify(lastOutputs)}`,
    );
  }

  async runAndWait(
    webappId,
    {
      nodeOverrides,
      pollIntervalMs = 12_000,
      timeoutMs = 1_800_000,
      instanceType = undefined,
      webhookUrl = undefined,
    },
  ) {
    const payload = await this.preparePayload(webappId, {
      nodeOverrides,
      instanceType,
      webhookUrl,
    });
    const submit = await this.submitPayload(payload);
    if (submit?.code !== 0) {
      throw new RunningHubTaskFailure(
        String(submit?.data?.taskId ?? 'unknown'),
        submit,
      );
    }
    const taskId = String(submit?.data?.taskId);
    const final = await this.waitForCompletion(taskId, {
      pollIntervalMs,
      timeoutMs,
    });
    return {
      payload,
      submit,
      final,
    };
  }
}
