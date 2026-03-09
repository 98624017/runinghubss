const ERROR_MAP: Record<number, string> = {
  400: "请求参数错误，请检查输入",
  401: "API Key 无效或已过期",
  403: "无权访问该资源",
  404: "请求的资源不存在",
  429: "请求过于频繁，请稍后再试",
  433: "账户余额不足，请充值后再试",
  500: "RunningHub 服务器内部错误，请稍后重试",
  502: "RunningHub 服务暂时不可用",
  503: "RunningHub 服务维护中",
};

export function mapRunningHubError(code: number, originalMsg?: string): string {
  return ERROR_MAP[code] || originalMsg || `未知错误 (code: ${code})`;
}
