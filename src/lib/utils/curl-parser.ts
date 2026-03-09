interface ParsedCurl {
  url: string;
  appId: string;
  nodeInfoList: Array<{
    nodeId: string;
    fieldName: string;
    fieldValue: string;
    description?: string;
  }>;
}

export function parseCurlCommand(curl: string): ParsedCurl {
  // 提取 URL
  const urlMatch = curl.match(/(?:--location\s+(?:--request\s+POST\s+)?)?['"]?(https?:\/\/[^\s'"]+)['"]?/);
  if (!urlMatch) throw new Error("无法解析URL");

  const url = urlMatch[1];

  // 从 URL 提取 appId
  const appIdMatch = url.match(/\/(\d{15,25})(?:\?|$|')/);
  if (!appIdMatch) throw new Error("无法从URL中提取应用ID");

  const appId = appIdMatch[1];

  // 提取 --data-raw 或 -d 的 JSON body
  const dataMatch = curl.match(/(?:--data-raw|--data|-d)\s+'(\{[\s\S]*?\})'/);
  if (!dataMatch) throw new Error("无法解析请求体");

  let body: { nodeInfoList?: Array<{ nodeId: string; fieldName: string; fieldValue: string; description?: string }> };
  try {
    body = JSON.parse(dataMatch[1]);
  } catch {
    throw new Error("请求体JSON格式无效");
  }

  if (!body.nodeInfoList || !Array.isArray(body.nodeInfoList)) {
    throw new Error("请求体中缺少nodeInfoList");
  }

  return {
    url,
    appId,
    nodeInfoList: body.nodeInfoList,
  };
}
