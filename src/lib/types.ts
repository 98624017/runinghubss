export interface TaskHistoryItem {
  id?: number;
  apiKeyHash: string;
  appId: string;
  appName: string;
  taskId: string;
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED";
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
  createdAt: Date;
  completedAt: Date | null;
  costInfo: Record<string, unknown> | null;
}

export interface RunningHubUploadResponse {
  code: number;
  msg: string;
  data: {
    type: string;
    fileName: string;
    size: string;
    download_url: string;
  };
}

export interface RunningHubTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface RunningHubStatusResponse {
  code: number;
  msg: string;
  data: {
    taskStatus: string;
    taskId: string;
  };
}

export interface RunningHubResultResponse {
  code: number;
  msg: string;
  data: Array<{
    fileUrl: string;
    fileType: string;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
