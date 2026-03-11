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

  // V2 接口（/openapi/v2/...）不使用 {code, msg, data} 信封，直接返回平铺数据
  // V1 接口使用 {code: 0, msg: "success", data: ...} 格式
  const isV2 = endpoint.startsWith("/openapi/v2/");

  if (isV2) {
    // V2 错误可能通过三种形态传递：
    // 1) errorCode/errorMessage（平铺）
    // 2) {code, msg, data}（例如 TOKEN_INVALID）
    // 3) 成功时直接返回平铺数据（无信封）

    // 1) errorCode/errorMessage
    const errorCodeRaw = data?.errorCode;
    const hasErrorCode =
      errorCodeRaw !== undefined &&
      errorCodeRaw !== null &&
      String(errorCodeRaw) !== "";
    if (hasErrorCode) {
      const errorCodeNum = Number(errorCodeRaw);
      const isOk = Number.isFinite(errorCodeNum) && errorCodeNum === 0;
      if (!isOk) {
        throw new Error(
          mapRunningHubError(
            Number.isFinite(errorCodeNum) ? errorCodeNum : 0,
            typeof data?.errorMessage === "string" ? data.errorMessage : undefined
          )
        );
      }
    }

    // 2) 兼容 {code, msg, data} 信封式响应：不要二次包装
    const maybeEnvelope =
      data &&
      typeof data === "object" &&
      "code" in data &&
      typeof (data as { msg?: unknown }).msg === "string";
    if (maybeEnvelope) {
      const codeRaw = (data as { code?: unknown }).code;
      const codeNum = typeof codeRaw === "number" ? codeRaw : Number(codeRaw);
      if (Number.isFinite(codeNum) && codeNum !== 0 && codeNum !== 200) {
        throw new Error(mapRunningHubError(codeNum, (data as { msg: string }).msg));
      }
      return data;
    }

    // 3) 平铺数据：包装为 V1 格式以保持内部一致性
    return { code: 0, msg: "success", data };
  }

  // V1 信封格式检查
  const codeRaw = data?.code;
  const codeNum = typeof codeRaw === "number" ? codeRaw : Number(codeRaw);
  if (!Number.isFinite(codeNum) || (codeNum !== 0 && codeNum !== 200)) {
    throw new Error(
      mapRunningHubError(Number.isFinite(codeNum) ? codeNum : 0, data?.msg)
    );
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

// 查询账户余额 — 使用 V1 接口 /uc/openapi/accountStatus
// 注意：此接口 body 中 key 字段名为 apikey（小写 k）
export async function getAccountBalance(apiKey: string) {
  const url = `${RH_API_BASE}/uc/openapi/accountStatus`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: apiKey }),
  });

  if (!res.ok) {
    throw new Error(mapRunningHubError(res.status));
  }

  const data = await res.json();

  if (data.code !== 0) {
    throw new Error(mapRunningHubError(data.code, data.msg));
  }

  return data;
}
