import { RH_API_BASE } from "@/lib/constants";
import { mapRunningHubError } from "@/lib/utils/error-mapper";

// 参考: skills/runninghub-api-dev/references/12-verified-findings.md
// 鉴权差异：部分接口依赖 Body apiKey，部分依赖 Header Authorization

interface RHRequestOptions {
  apiKey: string;
  endpoint: string;
  body?: Record<string, unknown>;
  useHeaderAuth?: boolean; // V2 接口优先用 Header
}

async function rhFetch({ apiKey, endpoint, body, useHeaderAuth }: RHRequestOptions) {
  const url = `${RH_API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (useHeaderAuth) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // 大部分接口在 body 中也需要 apiKey
  const finalBody = body ? { apiKey, ...body } : { apiKey };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(finalBody),
  });

  if (!res.ok) {
    throw new Error(mapRunningHubError(res.status));
  }

  const data = await res.json();

  if (data.code !== 0 && data.code !== 200) {
    throw new Error(mapRunningHubError(data.code, data.msg));
  }

  return data;
}

// 上传文件 — 参考: skills/runninghub-api-dev/references/06-uploads.md
export async function uploadFile(apiKey: string, file: Buffer, filename: string) {
  const url = `${RH_API_BASE}/openapi/v2/media/upload/binary`;

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(file)]);
  formData.append("file", blob, filename);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(mapRunningHubError(res.status));
  }

  const data = await res.json();

  if (data.code !== 0) {
    throw new Error(mapRunningHubError(data.code, data.msg));
  }

  // 返回 fileName 用于回填 nodeInfoList
  return data.data as { fileName: string; download_url: string };
}

// 创建 AI App 任务 — 参考: skills/runninghub-api-dev/references/02-api-concepts.md
export async function createTask(
  apiKey: string,
  appId: string,
  nodeInfoList: Array<{ nodeId: string; fieldName: string; fieldValue: string }>
) {
  return rhFetch({
    apiKey,
    endpoint: `/openapi/v2/run/ai-app/${appId}`,
    body: { nodeInfoList },
    useHeaderAuth: true,
  });
}

// 查询任务状态
export async function getTaskStatus(apiKey: string, taskId: string) {
  return rhFetch({
    apiKey,
    endpoint: "/task/openapi/status",
    body: { taskId },
  });
}

// 查询任务结果
export async function getTaskResult(apiKey: string, taskId: string) {
  return rhFetch({
    apiKey,
    endpoint: "/task/openapi/outputs",
    body: { taskId },
  });
}

// 查询账户余额
export async function getAccountBalance(apiKey: string) {
  return rhFetch({
    apiKey,
    endpoint: "/openapi/v2/user/balance",
    useHeaderAuth: true,
  });
}
