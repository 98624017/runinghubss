export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export class RunningHubApiError extends HttpError {
  readonly upstreamCode?: number;

  readonly upstreamPayload?: unknown;

  constructor(message: string, options: { upstreamCode?: number; upstreamPayload?: unknown } = {}) {
    super(502, message);
    this.name = 'RunningHubApiError';
    this.upstreamCode = options.upstreamCode;
    this.upstreamPayload = options.upstreamPayload;
  }
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message);
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
