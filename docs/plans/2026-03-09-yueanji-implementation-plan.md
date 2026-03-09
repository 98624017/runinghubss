# 悦安居平台 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **REQUIRED SKILL:** 涉及 RunningHub API 调用时，务必先阅读 `skills/runninghub-api-dev/SKILL.md` 获取 API 文档、验证记录和最佳实践。入口导航见该文件。

**Goal:** 构建"悦安居"家装软装自动出图平台 — 一个基于 RunningHub API 的全栈 Next.js 应用，支持 4 个 AI 设计应用、动态表单工作区、后台管理和 Docker 部署。

**Architecture:** Next.js 15 App Router 全栈。API Routes 作为 RunningHub 代理层，前端 Zustand + IndexedDB 管理任务状态与历史，服务端 SQLite + Prisma 存储应用配置和管理数据。方案 C：默认前端轮询，可选 Webhook 增强。

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, shadcn/ui, Prisma (SQLite), Zustand, Dexie.js, Zod, Jose (JWT), pnpm

**Design Doc:** `docs/plans/2026-03-09-yueanji-platform-design.md`

---

## Phase 1: 项目脚手架与基础设施

### Task 1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.env.example`
- Create: `.env.local`
- Create: `.gitignore`

**Step 1: 创建 Next.js 项目**

```bash
cd /home/feng/project/runinghubss
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

如果目录非空，先在临时目录创建再移动核心文件。

**Step 2: 安装核心依赖**

```bash
pnpm add prisma @prisma/client zod zustand dexie dexie-react-hooks jose bcryptjs
pnpm add -D @types/bcryptjs
```

**Step 3: 安装 shadcn/ui**

```bash
pnpm dlx shadcn@latest init -d
```

选择: New York style, Zinc color, CSS variables enabled.

**Step 4: 安装常用 shadcn 组件**

```bash
pnpm dlx shadcn@latest add button input label card dialog select switch textarea tabs table badge toast dropdown-menu separator avatar form sheet scroll-area alert skeleton tooltip
```

**Step 5: 创建环境变量文件**

`.env.example`:
```env
PORT=3000
DATABASE_URL="file:./prisma/app.db"
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=change-me-in-production
WEBHOOK_ENABLED=false
MAX_UPLOAD_SIZE=10485760
MAX_CONCURRENT_TASKS=30
```

复制为 `.env.local` 用于本地开发。

**Step 6: 配置 next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;
```

`output: "standalone"` 用于 Docker 部署。

**Step 7: 验证项目启动**

```bash
pnpm dev
```

Expected: 浏览器打开 http://localhost:3000 看到 Next.js 默认页面。

**Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js 15 project with Tailwind, shadcn/ui, and core dependencies"
```

---

### Task 2: Prisma Schema 与数据库初始化

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `prisma/seed.ts`

**Step 1: 初始化 Prisma**

```bash
pnpm prisma init --datasource-provider sqlite
```

**Step 2: 编写 Prisma Schema**

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model AiApp {
  id          String       @id @default(cuid())
  name        String
  description String
  icon        String       @default("sparkles")
  rhAppId     String       @unique
  category    String       @default("design")
  sortOrder   Int          @default(0)
  enabled     Boolean      @default(true)
  multiplier  Float?
  config      String       @default("{}")
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  fields      AiAppField[]
}

model AiAppField {
  id           String  @id @default(cuid())
  appId        String
  nodeId       String
  fieldName    String
  fieldType    String  // IMAGE, STRING, INT, LIST, BOOLEAN
  label        String
  description  String  @default("")
  required     Boolean @default(true)
  defaultValue String?
  options      String? // JSON string for LIST type
  sortOrder    Int     @default(0)
  app          AiApp   @relation(fields: [appId], references: [id], onDelete: Cascade)

  @@index([appId])
}

model KeyMultiplier {
  id         String   @id @default(cuid())
  apiKeyHash String   @unique
  multiplier Float    @default(1.0)
  note       String?
  createdAt  DateTime @default(now())
}

model AdminUser {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model SystemConfig {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

**Step 3: 创建 Prisma 客户端单例**

`src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Step 4: 编写种子脚本**

`prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 创建默认管理员
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  await prisma.adminUser.upsert({
    where: { username },
    update: {},
    create: {
      username,
      passwordHash: hashSync(password, 10),
    },
  });

  // 全局默认倍率
  await prisma.systemConfig.upsert({
    where: { key: "global_multiplier" },
    update: {},
    create: { key: "global_multiplier", value: "1.5" },
  });

  await prisma.systemConfig.upsert({
    where: { key: "webhook_enabled" },
    update: {},
    create: { key: "webhook_enabled", value: "false" },
  });

  await prisma.systemConfig.upsert({
    where: { key: "site_name" },
    update: {},
    create: { key: "site_name", value: "悦安居" },
  });

  // ============================================
  // 四个 AI 应用 — 数据来源:
  //   skills/runninghub-api-dev/assets/app-source-pages/*-api-demo.json
  //   skills/runninghub-api-dev/references/15-ai-app-validation.md
  // ============================================

  // 1. 一键彩平
  const app1 = await prisma.aiApp.upsert({
    where: { rhAppId: "1994388299756212225" },
    update: {},
    create: {
      name: "一键彩平",
      description: "CAD平面白图填色变立体，保持图纸一致性",
      icon: "palette",
      rhAppId: "1994388299756212225",
      category: "floor-plan",
      sortOrder: 1,
      enabled: true,
    },
  });
  await seedFields(app1.id, [
    { nodeId: "257", fieldName: "image", fieldType: "IMAGE", label: "上传平面白图", description: "上传CAD平面图（白图）", required: true, sortOrder: 1 },
    { nodeId: "253", fieldName: "text", fieldType: "STRING", label: "提示词", description: "描述词（仅支持英文，可不修改使用默认值）", required: false, defaultValue: "3D rendering of a top-down view apartment floor plan with realistic furniture and decor, soft lighting, modern interior design style, high detail, architectural visualization", sortOrder: 2 },
    { nodeId: "260", fieldName: "width", fieldType: "INT", label: "出图宽度", description: "出图尺寸宽度（需与高度一致）", required: false, defaultValue: "1600", sortOrder: 3 },
    { nodeId: "260", fieldName: "height", fieldType: "INT", label: "出图高度", description: "出图尺寸高度（需与宽度一致）", required: false, defaultValue: "1600", sortOrder: 4 },
  ]);

  // 2. 外观迁移
  const app2 = await prisma.aiApp.upsert({
    where: { rhAppId: "1986819253754130433" },
    update: {},
    create: {
      name: "外观迁移",
      description: "从参考图中精准提取风格，应用到原始图像上",
      icon: "repeat",
      rhAppId: "1986819253754130433",
      category: "style-transfer",
      sortOrder: 2,
      enabled: true,
    },
  });
  await seedFields(app2.id, [
    { nodeId: "1", fieldName: "image", fieldType: "IMAGE", label: "上传原始图像", description: "上传你的原始建筑/景观图像", required: true, sortOrder: 1 },
    { nodeId: "403", fieldName: "image", fieldType: "IMAGE", label: "上传风格参考图", description: "上传你想要提取风格的意向图", required: true, sortOrder: 2 },
  ]);

  // 3. 平面转效果
  const app3 = await prisma.aiApp.upsert({
    where: { rhAppId: "2003678561775067138" },
    update: {},
    create: {
      name: "平面转效果",
      description: "支持最多9张图融合，生成室内效果图",
      icon: "layers",
      rhAppId: "2003678561775067138",
      category: "rendering",
      sortOrder: 3,
      enabled: true,
    },
  });
  await seedFields(app3.id, [
    { nodeId: "2", fieldName: "prompt", fieldType: "STRING", label: "提示词", description: "描述你想要的效果（支持中文）", required: true, defaultValue: "", sortOrder: 1 },
    { nodeId: "3", fieldName: "image", fieldType: "IMAGE", label: "参考图1（主图）", description: "第1张参考图", required: true, sortOrder: 2 },
    { nodeId: "7", fieldName: "image", fieldType: "IMAGE", label: "参考图2", description: "第2张参考图", required: false, sortOrder: 3 },
    { nodeId: "8", fieldName: "image", fieldType: "IMAGE", label: "参考图3", description: "第3张参考图", required: false, sortOrder: 4 },
    { nodeId: "11", fieldName: "image", fieldType: "IMAGE", label: "参考图4", description: "第4张参考图", required: false, sortOrder: 5 },
    { nodeId: "12", fieldName: "image", fieldType: "IMAGE", label: "参考图5", description: "第5张参考图", required: false, sortOrder: 6 },
    { nodeId: "13", fieldName: "image", fieldType: "IMAGE", label: "参考图6", description: "第6张参考图", required: false, sortOrder: 7 },
    { nodeId: "14", fieldName: "image", fieldType: "IMAGE", label: "参考图7", description: "第7张参考图", required: false, sortOrder: 8 },
    { nodeId: "15", fieldName: "image", fieldType: "IMAGE", label: "参考图8", description: "第8张参考图", required: false, sortOrder: 9 },
    { nodeId: "18", fieldName: "image", fieldType: "IMAGE", label: "参考图9", description: "第9张参考图", required: false, sortOrder: 10 },
  ]);

  // 4. 毛坯转效果
  const app4 = await prisma.aiApp.upsert({
    where: { rhAppId: "2023563076041183233" },
    update: {},
    create: {
      name: "毛坯转效果",
      description: "一键将毛坯房照片生成装修效果图",
      icon: "home",
      rhAppId: "2023563076041183233",
      category: "renovation",
      sortOrder: 4,
      enabled: true,
    },
  });
  await seedFields(app4.id, [
    { nodeId: "541", fieldName: "image", fieldType: "IMAGE", label: "上传毛坯照片", description: "上传毛坯房实拍照片", required: true, sortOrder: 1 },
    { nodeId: "538", fieldName: "image", fieldType: "IMAGE", label: "上传风格参考", description: "上传装修风格参考图", required: true, sortOrder: 2 },
    { nodeId: "558", fieldName: "text", fieldType: "STRING", label: "提示词", description: "描述装修风格及家具布局（支持中文）", required: false, defaultValue: "", sortOrder: 3 },
    { nodeId: "605", fieldName: "aspectRatio", fieldType: "LIST", label: "出图比例", description: "选择输出图片的宽高比", required: false, defaultValue: "auto", options: JSON.stringify(["auto", "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]), sortOrder: 4 },
    { nodeId: "605", fieldName: "resolution", fieldType: "LIST", label: "出图分辨率", description: "选择输出分辨率（高分辨率消耗更多额度）", required: false, defaultValue: "2k", options: JSON.stringify(["1k", "2k", "4k"]), sortOrder: 5 },
    { nodeId: "605", fieldName: "channel", fieldType: "LIST", label: "渠道", description: "Third-party较便宜，Official较贵但质量可能更稳定", required: false, defaultValue: "Third-party", options: JSON.stringify(["Third-party", "Official"]), sortOrder: 6 },
  ]);

  console.log("Seed completed successfully.");
}

async function seedFields(
  appId: string,
  fields: Array<{
    nodeId: string;
    fieldName: string;
    fieldType: string;
    label: string;
    description: string;
    required: boolean;
    defaultValue?: string;
    options?: string;
    sortOrder: number;
  }>
) {
  // 清除旧字段再重建
  await prisma.aiAppField.deleteMany({ where: { appId } });
  for (const field of fields) {
    await prisma.aiAppField.create({
      data: { appId, ...field },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Step 5: 配置 seed 脚本到 package.json**

在 `package.json` 中添加:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

安装 tsx:
```bash
pnpm add -D tsx
```

**Step 6: 生成 Prisma Client 并运行迁移和种子**

```bash
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

Expected: 数据库创建成功，4 个应用和管理员数据插入。

**Step 7: 验证数据**

```bash
pnpm prisma studio
```

Expected: 打开 Prisma Studio，能看到 AiApp (4条), AiAppField (22条), AdminUser (1条), SystemConfig (3条)。

**Step 8: Commit**

```bash
git add prisma/ src/lib/prisma.ts package.json pnpm-lock.yaml
git commit -m "feat: add Prisma schema with SQLite, seed 4 AI apps and admin user"
```

---

### Task 3: 共享类型定义与 Zod Schema

**Files:**
- Create: `src/lib/schemas/app.ts`
- Create: `src/lib/schemas/admin.ts`
- Create: `src/lib/schemas/task.ts`
- Create: `src/lib/types.ts`
- Create: `src/lib/constants.ts`

**Step 1: 创建常量文件**

`src/lib/constants.ts`:
```typescript
export const FIELD_TYPES = ["IMAGE", "STRING", "INT", "LIST", "BOOLEAN"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const TASK_STATUSES = ["QUEUED", "RUNNING", "SUCCESS", "FAILED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 10485760; // 10MB
export const MAX_CONCURRENT_TASKS = Number(process.env.MAX_CONCURRENT_TASKS) || 30;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const RH_API_BASE = "https://www.runninghub.cn";

export const POLLING_INTERVALS = {
  FAST: 3000,      // 0-30s
  MEDIUM: 5000,    // 30-120s
  SLOW: 10000,     // 120s+
  TIMEOUT: 600000, // 10min
} as const;
```

**Step 2: 创建 Zod Schemas**

`src/lib/schemas/app.ts`:
```typescript
import { z } from "zod";

export const aiAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  rhAppId: z.string(),
  category: z.string(),
  sortOrder: z.number(),
  enabled: z.boolean(),
  fields: z.array(
    z.object({
      id: z.string(),
      nodeId: z.string(),
      fieldName: z.string(),
      fieldType: z.enum(["IMAGE", "STRING", "INT", "LIST", "BOOLEAN"]),
      label: z.string(),
      description: z.string(),
      required: z.boolean(),
      defaultValue: z.string().nullable(),
      options: z.string().nullable(), // JSON string
      sortOrder: z.number(),
    })
  ),
});

export type AiAppWithFields = z.infer<typeof aiAppSchema>;
```

`src/lib/schemas/task.ts`:
```typescript
import { z } from "zod";

export const createTaskSchema = z.object({
  appId: z.string().min(1, "应用ID不能为空"),
  fields: z.record(z.string(), z.unknown()),
});

export const taskStatusSchema = z.object({
  taskId: z.string().min(1, "任务ID不能为空"),
});
```

`src/lib/schemas/admin.ts`:
```typescript
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

export const createAppSchema = z.object({
  name: z.string().min(1, "应用名称不能为空"),
  description: z.string().min(1, "应用描述不能为空"),
  icon: z.string().default("sparkles"),
  rhAppId: z.string().min(1, "RunningHub应用ID不能为空"),
  category: z.string().default("design"),
  sortOrder: z.number().default(0),
  enabled: z.boolean().default(true),
  fields: z.array(
    z.object({
      nodeId: z.string().min(1),
      fieldName: z.string().min(1),
      fieldType: z.enum(["IMAGE", "STRING", "INT", "LIST", "BOOLEAN"]),
      label: z.string().min(1),
      description: z.string().default(""),
      required: z.boolean().default(true),
      defaultValue: z.string().optional(),
      options: z.string().optional(),
      sortOrder: z.number().default(0),
    })
  ),
});

export const updateAppSchema = createAppSchema.partial().extend({
  id: z.string(),
});

export const keyMultiplierSchema = z.object({
  apiKey: z.string().min(1, "API Key不能为空"),
  multiplier: z.number().min(0.1, "倍率最小为0.1").max(100, "倍率最大为100"),
  note: z.string().optional(),
});

export const curlParseSchema = z.object({
  curl: z.string().min(1, "curl命令不能为空"),
});
```

**Step 3: 创建类型文件**

`src/lib/types.ts`:
```typescript
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
```

**Step 4: Commit**

```bash
git add src/lib/
git commit -m "feat: add shared Zod schemas, types, and constants"
```

---

### Task 4: 工具函数层

**Files:**
- Create: `src/lib/utils/crypto.ts`
- Create: `src/lib/utils/curl-parser.ts`
- Create: `src/lib/utils/error-mapper.ts`
- Create: `src/lib/utils/rate-limiter.ts`

**Step 1: 编写 crypto 工具**

`src/lib/utils/crypto.ts`:
```typescript
import { createHash } from "crypto";

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return "****";
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}
```

**Step 2: 编写 curl 解析器**

`src/lib/utils/curl-parser.ts`:
```typescript
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
```

**Step 3: 编写 RunningHub 错误码映射**

`src/lib/utils/error-mapper.ts`:
```typescript
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
```

**Step 4: 编写速率限制器**

`src/lib/utils/rate-limiter.ts`:
```typescript
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1分钟
const MAX_REQUESTS = 60;  // 每分钟60次

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

// 定期清理过期条目
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);
```

**Step 5: Commit**

```bash
git add src/lib/utils/
git commit -m "feat: add utility functions (crypto, curl parser, error mapper, rate limiter)"
```

---

## Phase 2: 后台管理 API

### Task 5: Admin 鉴权中间件 (JWT)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/admin/login/route.ts`

**Step 1: 编写 JWT 工具**

`src/lib/auth.ts`:
```typescript
import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "./types";

const JWT_SECRET_KEY = process.env.JWT_SECRET || "default-dev-secret-change-in-prod";
const secret = new TextEncoder().encode(JWT_SECRET_KEY);

export async function signToken(payload: { sub: string; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; username: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function withAdminAuth(
  req: NextRequest,
  handler: (req: NextRequest, admin: { sub: string; username: string }) => Promise<NextResponse<ApiResponse>>
): Promise<NextResponse<ApiResponse>> {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, error: "登录已过期" }, { status: 401 });
  }

  return handler(req, payload);
}
```

**Step 2: 编写登录 API**

`src/app/api/admin/login/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { compareSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    const user = await prisma.adminUser.findUnique({ where: { username } });

    if (!user || !compareSync(password, user.passwordHash)) {
      return NextResponse.json(
        { success: false, error: "用户名或密码错误" },
        { status: 401 }
      );
    }

    const token = await signToken({ sub: user.id, username: user.username });
    return NextResponse.json({ success: true, data: { token } });
  } catch {
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
```

**Step 3: 验证登录 API**

```bash
pnpm dev &
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: `{"success":true,"data":{"token":"eyJ..."}}`

**Step 4: Commit**

```bash
git add src/lib/auth.ts src/app/api/admin/login/
git commit -m "feat: add admin JWT authentication"
```

---

### Task 6: 应用管理 CRUD API

**Files:**
- Create: `src/app/api/admin/apps/route.ts`
- Create: `src/app/api/admin/apps/[id]/route.ts`
- Create: `src/app/api/admin/parse-curl/route.ts`

**Step 1: 编写应用列表 & 创建 API**

`src/app/api/admin/apps/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/auth";
import { createAppSchema } from "@/lib/schemas/admin";

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const apps = await prisma.aiApp.findMany({
      include: { fields: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, data: apps });
  });
}

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      const parsed = createAppSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }

      const { fields, ...appData } = parsed.data;

      const app = await prisma.aiApp.create({
        data: {
          ...appData,
          fields: {
            create: fields,
          },
        },
        include: { fields: true },
      });

      return NextResponse.json({ success: true, data: app });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "创建失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
```

**Step 2: 编写应用更新 & 删除 API**

`src/app/api/admin/apps/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/auth";
import { createAppSchema } from "@/lib/schemas/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    const { id } = await params;
    const app = await prisma.aiApp.findUnique({
      where: { id },
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    });

    if (!app) {
      return NextResponse.json({ success: false, error: "应用不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: app });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      const parsed = createAppSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }

      const { fields, ...appData } = parsed.data;

      // 事务：更新应用 + 重建字段
      const app = await prisma.$transaction(async (tx) => {
        await tx.aiAppField.deleteMany({ where: { appId: id } });
        return tx.aiApp.update({
          where: { id },
          data: {
            ...appData,
            fields: { create: fields },
          },
          include: { fields: true },
        });
      });

      return NextResponse.json({ success: true, data: app });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "更新失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { id } = await params;
      await prisma.aiApp.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
    }
  });
}
```

**Step 3: 编写 curl 解析 API**

`src/app/api/admin/parse-curl/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth";
import { parseCurlCommand } from "@/lib/utils/curl-parser";

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { curl } = await req.json();
      const parsed = parseCurlCommand(curl);

      // 将 nodeInfoList 转换为字段配置建议
      const fields = parsed.nodeInfoList.map((node, index) => ({
        nodeId: node.nodeId,
        fieldName: node.fieldName,
        fieldType: inferFieldType(node.fieldValue, node.fieldName),
        label: node.description || `字段 ${node.nodeId}`,
        description: node.description || "",
        required: true,
        defaultValue: isImageField(node.fieldName, node.fieldValue) ? undefined : node.fieldValue,
        sortOrder: index + 1,
      }));

      return NextResponse.json({
        success: true,
        data: { appId: parsed.appId, fields },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "解析失败";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
  });
}

function inferFieldType(value: string, fieldName: string): string {
  if (fieldName === "image" || /\.(png|jpg|jpeg|webp)$/i.test(value)) return "IMAGE";
  if (value === "true" || value === "false") return "BOOLEAN";
  if (/^\d+$/.test(value) && !value.includes(".")) return "INT";
  return "STRING";
}

function isImageField(fieldName: string, value: string): boolean {
  return fieldName === "image" || /\.(png|jpg|jpeg|webp)$/i.test(value);
}
```

**Step 4: Commit**

```bash
git add src/app/api/admin/
git commit -m "feat: add admin CRUD API for apps and curl parser"
```

---

### Task 7: Key 倍率管理 & 系统设置 API

**Files:**
- Create: `src/app/api/admin/keys/route.ts`
- Create: `src/app/api/admin/keys/[id]/route.ts`
- Create: `src/app/api/admin/settings/route.ts`

**Step 1: 编写 Key 倍率 API**

`src/app/api/admin/keys/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/auth";
import { keyMultiplierSchema } from "@/lib/schemas/admin";
import { hashApiKey, maskApiKey } from "@/lib/utils/crypto";

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const keys = await prisma.keyMultiplier.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 返回脱敏后的列表（hash 不可逆，返回原始 hash 和备注）
    return NextResponse.json({ success: true, data: keys });
  });
}

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      const parsed = keyMultiplierSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }

      const { apiKey, multiplier, note } = parsed.data;
      const apiKeyHash = hashApiKey(apiKey);

      const result = await prisma.keyMultiplier.upsert({
        where: { apiKeyHash },
        update: { multiplier, note },
        create: {
          apiKeyHash,
          multiplier,
          note: note || maskApiKey(apiKey),
        },
      });

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "操作失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
```

`src/app/api/admin/keys/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async () => {
    try {
      const { id } = await params;
      await prisma.keyMultiplier.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
    }
  });
}
```

**Step 2: 编写系统设置 API**

`src/app/api/admin/settings/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const configs = await prisma.systemConfig.findMany();
    const settings = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    return NextResponse.json({ success: true, data: settings });
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const body: Record<string, string> = await req.json();

      const updates = Object.entries(body).map(([key, value]) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      );

      await prisma.$transaction(updates);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: false, error: "保存失败" }, { status: 500 });
    }
  });
}
```

**Step 3: Commit**

```bash
git add src/app/api/admin/keys/ src/app/api/admin/settings/
git commit -m "feat: add admin API for key multiplier management and system settings"
```

---

## Phase 3: RunningHub 代理 API

> **重要提示**: 实现此阶段时，务必先阅读以下 Skill 文档：
> - `skills/runninghub-api-dev/references/02-api-concepts.md` — nodeInfoList 结构
> - `skills/runninghub-api-dev/references/06-uploads.md` — 上传回填流程
> - `skills/runninghub-api-dev/references/07-task-status-results-webhook.md` — 任务状态轮询
> - `skills/runninghub-api-dev/references/08-errors-and-debugging.md` — 错误排障
> - `skills/runninghub-api-dev/references/12-verified-findings.md` — 实测结论（鉴权差异等）
> - `skills/runninghub-api-dev/references/15-ai-app-validation.md` — 四应用真实闭环验证

### Task 8: RunningHub API 客户端封装

**Files:**
- Create: `src/lib/runninghub/client.ts`
- Create: `src/lib/runninghub/types.ts`

**Step 1: 编写 RunningHub 客户端**

`src/lib/runninghub/client.ts`:
```typescript
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
  const blob = new Blob([file]);
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
```

**Step 2: Commit**

```bash
git add src/lib/runninghub/
git commit -m "feat: add RunningHub API client with upload, task create, status, and result"
```

---

### Task 9: 用户侧代理 API Routes

**Files:**
- Create: `src/app/api/upload/route.ts`
- Create: `src/app/api/task/create/route.ts`
- Create: `src/app/api/task/status/route.ts`
- Create: `src/app/api/task/result/route.ts`
- Create: `src/app/api/account/balance/route.ts`
- Create: `src/lib/middleware/api-key.ts`

**Step 1: 编写 API Key 提取中间件**

`src/lib/middleware/api-key.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { hashApiKey } from "@/lib/utils/crypto";
import { ApiResponse } from "@/lib/types";

export function extractApiKey(req: NextRequest): string | null {
  return req.headers.get("x-api-key");
}

export async function withApiKey(
  req: NextRequest,
  handler: (req: NextRequest, apiKey: string) => Promise<NextResponse<ApiResponse>>
): Promise<NextResponse<ApiResponse>> {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "请先设置 API Key" },
      { status: 401 }
    );
  }

  const keyHash = hashApiKey(apiKey);
  const { allowed, remaining } = checkRateLimit(keyHash);

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "请求过于频繁，请稍后再试" },
      { status: 429 }
    );
  }

  const response = await handler(req, apiKey);
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}
```

**Step 2: 编写上传代理**

`src/app/api/upload/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { withApiKey } from "@/lib/middleware/api-key";
import { uploadFile } from "@/lib/runninghub/client";
import { MAX_UPLOAD_SIZE, ACCEPTED_IMAGE_TYPES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  return withApiKey(req, async (_req, apiKey) => {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "未选择文件" },
          { status: 400 }
        );
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: "仅支持 JPG、PNG、WebP 格式" },
          { status: 400 }
        );
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        return NextResponse.json(
          { success: false, error: `文件大小不能超过 ${MAX_UPLOAD_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadFile(apiKey, buffer, file.name);

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "上传失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
```

**Step 3: 编写任务创建代理**

`src/app/api/task/create/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { withApiKey } from "@/lib/middleware/api-key";
import { createTask } from "@/lib/runninghub/client";
import { createTaskSchema } from "@/lib/schemas/task";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  return withApiKey(req, async (_req, apiKey) => {
    try {
      const body = await req.json();
      const parsed = createTaskSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }

      const { appId, fields } = parsed.data;

      // 获取应用配置以拿到 rhAppId
      const app = await prisma.aiApp.findUnique({
        where: { id: appId },
        include: { fields: true },
      });

      if (!app || !app.enabled) {
        return NextResponse.json(
          { success: false, error: "应用不存在或未启用" },
          { status: 404 }
        );
      }

      // 组装 nodeInfoList
      const nodeInfoList = app.fields
        .filter((f) => {
          const value = fields[f.id];
          return value !== undefined && value !== null && value !== "";
        })
        .map((f) => ({
          nodeId: f.nodeId,
          fieldName: f.fieldName,
          fieldValue: String(fields[f.id]),
        }));

      const result = await createTask(apiKey, app.rhAppId, nodeInfoList);

      return NextResponse.json({
        success: true,
        data: { taskId: result.data.taskId },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "创建任务失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
```

**Step 4: 编写任务状态和结果查询代理**

`src/app/api/task/status/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { withApiKey } from "@/lib/middleware/api-key";
import { getTaskStatus } from "@/lib/runninghub/client";
import { taskStatusSchema } from "@/lib/schemas/task";

export async function POST(req: NextRequest) {
  return withApiKey(req, async (_req, apiKey) => {
    try {
      const body = await req.json();
      const parsed = taskStatusSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }

      const result = await getTaskStatus(apiKey, parsed.data.taskId);
      return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "查询失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
```

`src/app/api/task/result/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { withApiKey } from "@/lib/middleware/api-key";
import { getTaskResult } from "@/lib/runninghub/client";
import { taskStatusSchema } from "@/lib/schemas/task";

export async function POST(req: NextRequest) {
  return withApiKey(req, async (_req, apiKey) => {
    try {
      const body = await req.json();
      const parsed = taskStatusSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }

      const result = await getTaskResult(apiKey, parsed.data.taskId);
      return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "查询失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
```

**Step 5: 编写余额查询代理**

`src/app/api/account/balance/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { withApiKey } from "@/lib/middleware/api-key";
import { getAccountBalance } from "@/lib/runninghub/client";

export async function POST(req: NextRequest) {
  return withApiKey(req, async (_req, apiKey) => {
    try {
      const result = await getAccountBalance(apiKey);
      return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "查询余额失败";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}
```

**Step 6: Commit**

```bash
git add src/app/api/upload/ src/app/api/task/ src/app/api/account/ src/lib/middleware/
git commit -m "feat: add RunningHub proxy API routes (upload, task CRUD, balance)"
```

---

### Task 10: 应用列表公开 API

**Files:**
- Create: `src/app/api/apps/route.ts`
- Create: `src/app/api/apps/[appId]/route.ts`

**Step 1: 编写公开 API（无需鉴权）**

`src/app/api/apps/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const apps = await prisma.aiApp.findMany({
    where: { enabled: true },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ success: true, data: apps });
}
```

`src/app/api/apps/[appId]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  const app = await prisma.aiApp.findFirst({
    where: { id: appId, enabled: true },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });

  if (!app) {
    return NextResponse.json(
      { success: false, error: "应用不存在" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: app });
}
```

**Step 2: Commit**

```bash
git add src/app/api/apps/
git commit -m "feat: add public API for app listing"
```

---

## Phase 4: 前端基础框架

### Task 11: 全局布局与导航

**Files:**
- Create: `src/app/layout.tsx` (修改默认)
- Create: `src/app/globals.css` (修改默认)
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/components/providers.tsx`

**要点:**
- `layout.tsx`: 设置中文 lang、字体、全局 Providers
- `providers.tsx`: 包装 Toaster、ThemeProvider 等
- `header.tsx`: 顶部导航栏 — Logo "悦安居" + 工作台/历史/设置 导航链接
- `sidebar.tsx`: 左侧边栏 — 读取 `/api/apps` 动态渲染应用列表
- `app-shell.tsx`: 组合 header + sidebar + main content 区域

**设计原则:**
- 响应式：移动端 sidebar 收起为 Sheet
- 使用 shadcn/ui 的 Sheet、Button、Separator 组件
- 品牌色可从 PDF 宣传物料中提取

**Step: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/components/
git commit -m "feat: add global layout with header, sidebar, and app shell"
```

---

### Task 12: API Key 管理与本地存储

**Files:**
- Create: `src/lib/stores/api-key-store.ts`
- Create: `src/components/api-key-dialog.tsx`
- Create: `src/lib/api-client.ts`
- Create: `src/app/settings/page.tsx`

**要点:**

`src/lib/stores/api-key-store.ts` — Zustand store with localStorage persist:
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ApiKeyState {
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isKeySet: () => boolean;
}

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set, get) => ({
      apiKey: "",
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: "" }),
      isKeySet: () => get().apiKey.length > 0,
    }),
    { name: "yueanji-api-key" }
  )
);
```

`src/lib/api-client.ts` — 封装 fetch，自动携带 API Key header:
```typescript
import { useApiKeyStore } from "./stores/api-key-store";

export async function apiClient<T>(
  url: string,
  options?: RequestInit & { skipApiKey?: boolean }
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { apiKey } = useApiKeyStore.getState();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (!options?.skipApiKey && apiKey) {
    headers["x-api-key"] = apiKey;
  }

  // 非 FormData 请求默认 JSON
  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });
  return res.json();
}
```

- `api-key-dialog.tsx`: 首次使用弹出的 Key 输入对话框 + 余额查询
- `settings/page.tsx`: 设置页面 — Key 管理、清除本地数据

**Step: Commit**

```bash
git add src/lib/stores/ src/lib/api-client.ts src/components/api-key-dialog.tsx src/app/settings/
git commit -m "feat: add API Key management with localStorage persistence"
```

---

### Task 13: IndexedDB 任务历史存储

**Files:**
- Create: `src/lib/db.ts`

**要点:**

`src/lib/db.ts`:
```typescript
import Dexie, { type EntityTable } from "dexie";
import { TaskHistoryItem } from "./types";

const db = new Dexie("YueanjiDB") as Dexie & {
  taskHistory: EntityTable<TaskHistoryItem, "id">;
};

db.version(1).stores({
  taskHistory: "++id, apiKeyHash, taskId, appId, status, createdAt",
});

export { db };
```

提供 hooks:
- `useTaskHistory(apiKeyHash)` — 按 Key 查询历史
- `addTaskRecord(item)` — 添加记录
- `updateTaskRecord(taskId, updates)` — 更新状态
- `cleanOldRecords(days)` — 清理旧记录

**Step: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add IndexedDB task history storage with Dexie.js"
```

---

### Task 14: Zustand 任务队列管理

**Files:**
- Create: `src/lib/stores/task-store.ts`

**要点:**

核心状态:
- `activeTasks: Map<string, TaskInfo>` — 当前活跃任务（taskId → 状态）
- `isPolling: boolean` — 轮询状态
- `addTask(task)` — 添加任务并开始轮询
- `removeTask(taskId)` — 移除完成的任务
- `pollTask(taskId)` — 单个任务轮询（渐进退避策略）
- `concurrentCount` — 当前并发数

轮询策略:
```typescript
function getPollingInterval(elapsedMs: number): number {
  if (elapsedMs < 30_000) return POLLING_INTERVALS.FAST;     // 3s
  if (elapsedMs < 120_000) return POLLING_INTERVALS.MEDIUM;  // 5s
  return POLLING_INTERVALS.SLOW;                              // 10s
}
```

超时处理: `elapsedMs > POLLING_INTERVALS.TIMEOUT` → 标记 FAILED

**Step: Commit**

```bash
git add src/lib/stores/task-store.ts
git commit -m "feat: add Zustand task queue store with progressive polling"
```

---

## Phase 5: 用户侧页面

### Task 15: 落地页

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/landing/hero.tsx`
- Create: `src/components/landing/features.tsx`
- Create: `src/components/landing/workflow.tsx`
- Create: `src/components/landing/footer.tsx`

**要点:**
- Hero: "悦安居 · 家装软装自动出图方案" + "AI赋能室内设计，一键生成专业效果图" + CTA 按钮
- Features: 4 个 AI 应用卡片（从 /api/apps 动态获取或 SSR）
- Workflow: 3 步流程图 — 上传素材 → AI 生成 → 下载成果
- Footer: 版权信息
- 参考 PDF 宣传物料的视觉风格

**Step: Commit**

```bash
git add src/app/page.tsx src/components/landing/
git commit -m "feat: add landing page with hero, features, workflow sections"
```

---

### Task 16: 工作台首页（应用列表卡片）

**Files:**
- Create: `src/app/workspace/page.tsx`
- Create: `src/app/workspace/layout.tsx`
- Create: `src/components/workspace/app-card.tsx`

**要点:**
- `layout.tsx`: 使用 AppShell 布局（header + sidebar + content）
- `page.tsx`: 获取应用列表，渲染为卡片网格
- `app-card.tsx`: 图标 + 名称 + 描述 + "开始使用"按钮
- 如果 API Key 未设置，卡片点击时弹出 Key 输入对话框
- 响应式网格：mobile 1列, tablet 2列, desktop 3-4列

**Step: Commit**

```bash
git add src/app/workspace/ src/components/workspace/
git commit -m "feat: add workspace home page with app cards grid"
```

---

### Task 17: 动态表单组件库

**Files:**
- Create: `src/components/workspace/fields/image-uploader.tsx`
- Create: `src/components/workspace/fields/text-input-field.tsx`
- Create: `src/components/workspace/fields/number-input-field.tsx`
- Create: `src/components/workspace/fields/select-field.tsx`
- Create: `src/components/workspace/fields/switch-field.tsx`
- Create: `src/components/workspace/fields/field-renderer.tsx`

**要点:**

`image-uploader.tsx`:
- 拖拽上传区域 + 点击选择
- 图片预览（缩略图）
- 上传进度指示
- 文件格式/大小校验
- 返回 RunningHub fileName

`field-renderer.tsx` — 根据 fieldType 分发组件:
```typescript
export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  switch (field.fieldType) {
    case "IMAGE":
      return <ImageUploader field={field} value={value} onChange={onChange} />;
    case "STRING":
      return <TextInputField field={field} value={value} onChange={onChange} />;
    case "INT":
      return <NumberInputField field={field} value={value} onChange={onChange} />;
    case "LIST":
      return <SelectField field={field} value={value} onChange={onChange} />;
    case "BOOLEAN":
      return <SwitchField field={field} value={value} onChange={onChange} />;
    default:
      return null;
  }
}
```

多图输入动态增减：IMAGE 类型且 `required=false` 的字段，初始隐藏，提供"添加更多参考图"按钮。

**Step: Commit**

```bash
git add src/components/workspace/fields/
git commit -m "feat: add dynamic form field components (image, text, number, select, switch)"
```

---

### Task 18: 应用工作区页面

**Files:**
- Create: `src/app/workspace/[appId]/page.tsx`
- Create: `src/components/workspace/workspace-form.tsx`
- Create: `src/components/workspace/result-panel.tsx`
- Create: `src/components/workspace/task-status-badge.tsx`
- Create: `src/components/workspace/recent-tasks.tsx`

**要点:**

`page.tsx`: 获取应用详情 → 渲染 WorkspaceForm + ResultPanel 左右分栏

`workspace-form.tsx`:
- 遍历 app.fields，用 FieldRenderer 渲染
- "开始生成"按钮 → 校验 → 上传图片 → 组装 nodeInfoList → 创建任务
- 并发检查（≤ 30）
- 提交后禁用按钮，显示进度

`result-panel.tsx`:
- 当前任务状态展示（TaskStatusBadge）
- 生成结果大图预览
- 下载按钮 + "结果链接有时效性，请及时下载"提醒
- 重试按钮（失败时）

`recent-tasks.tsx`:
- 当前应用的最近生成记录列表（从 IndexedDB 读取）
- 点击可切换查看历史结果

**布局:**
```
左栏（40%）: 输入表单      右栏（60%）: 结果展示
                            ├─ 当前任务状态
                            ├─ 结果大图
                            ├─ 操作按钮
                            └─ 最近记录
```

**Step: Commit**

```bash
git add src/app/workspace/[appId]/ src/components/workspace/
git commit -m "feat: add dynamic workspace page with form, result panel, and recent tasks"
```

---

### Task 19: 任务历史页面

**Files:**
- Create: `src/app/history/page.tsx`
- Create: `src/components/history/task-list.tsx`
- Create: `src/components/history/task-detail-dialog.tsx`

**要点:**
- 从 IndexedDB 读取当前 API Key 的所有任务历史
- 表格/列表展示：应用名、状态、时间、操作
- 支持按应用/状态筛选
- 点击查看详情（输入快照 + 结果链接）
- "清除历史"按钮

**Step: Commit**

```bash
git add src/app/history/ src/components/history/
git commit -m "feat: add task history page with filtering and detail view"
```

---

## Phase 6: 后台管理前端

### Task 20: 后台布局与登录页

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/lib/stores/admin-store.ts`
- Create: `src/lib/admin-api-client.ts`

**要点:**
- `admin-store.ts`: Zustand store 存储 admin JWT token (sessionStorage)
- `admin-api-client.ts`: 封装 fetch，自动携带 Bearer token
- `login/page.tsx`: 简洁的登录表单 — 用户名 + 密码 + 登录按钮
- `layout.tsx`: 检查登录状态，未登录重定向到 /admin/login
- 管理后台侧边栏：概览 / 应用管理 / Key 倍率 / 系统设置

**Step: Commit**

```bash
git add src/app/admin/ src/lib/stores/admin-store.ts src/lib/admin-api-client.ts
git commit -m "feat: add admin layout, login page, and auth store"
```

---

### Task 21: 后台 — 应用管理页面

**Files:**
- Create: `src/app/admin/apps/page.tsx`
- Create: `src/app/admin/apps/new/page.tsx`
- Create: `src/app/admin/apps/[id]/edit/page.tsx`
- Create: `src/components/admin/app-form.tsx`
- Create: `src/components/admin/curl-parser-dialog.tsx`
- Create: `src/components/admin/field-editor.tsx`

**要点:**

`apps/page.tsx`: 应用列表表格 — 名称 / 状态 / 排序 / 操作（编辑/删除）

`app-form.tsx`: 创建/编辑共用表单
- 基础信息: name, description, icon, rhAppId, category, sortOrder, enabled
- "从 curl 导入"按钮 → 弹出 CurlParserDialog

`curl-parser-dialog.tsx`:
- 大文本框粘贴 curl 命令
- 调用 `/api/admin/parse-curl` 解析
- 解析结果预览 → 确认导入字段配置

`field-editor.tsx`:
- 字段列表可增删改排序
- 每个字段：nodeId / fieldName / fieldType / label / description / required / defaultValue / options
- 拖拽排序（可选，初期用上下按钮）

**Step: Commit**

```bash
git add src/app/admin/apps/ src/components/admin/
git commit -m "feat: add admin app management pages with curl import"
```

---

### Task 22: 后台 — Key 倍率管理页面

**Files:**
- Create: `src/app/admin/keys/page.tsx`
- Create: `src/components/admin/key-multiplier-form.tsx`

**要点:**
- 全局默认倍率设置（顶部卡片）
- Key 列表表格: 脱敏 Key / 倍率 / 备注 / 操作
- 添加 Key 倍率对话框: 输入完整 Key + 倍率 + 备注

**Step: Commit**

```bash
git add src/app/admin/keys/ src/components/admin/key-multiplier-form.tsx
git commit -m "feat: add admin key multiplier management page"
```

---

### Task 23: 后台 — 系统设置页面

**Files:**
- Create: `src/app/admin/settings/page.tsx`

**要点:**
- 全局配置表单:
  - 站点名称
  - 全局默认倍率
  - Webhook 开关 + URL 配置
  - 最大上传大小
  - 最大并发任务数
- 保存按钮 → PUT `/api/admin/settings`

**Step: Commit**

```bash
git add src/app/admin/settings/
git commit -m "feat: add admin system settings page"
```

---

### Task 24: 后台 — 仪表盘概览

**Files:**
- Create: `src/app/admin/page.tsx`

**要点:**
- 统计卡片: 已启用应用数 / 已配置 Key 数 / 全局倍率 / Webhook 状态
- 应用快速列表
- 最近活动（可选，后续增强）

**Step: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add admin dashboard overview"
```

---

## Phase 7: 部署与 Docker

### Task 25: Dockerfile 与 Docker Compose

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

**Step 1: 编写 Dockerfile**

```dockerfile
FROM node:20-alpine AS base

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 入口脚本处理 DB 迁移 + seed
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
```

**Step 2: 编写入口脚本**

`docker-entrypoint.sh`:
```bash
#!/bin/sh
set -e

# 运行数据库迁移
npx prisma migrate deploy

# 运行 seed（仅首次）
npx prisma db seed || true

exec "$@"
```

**Step 3: 编写 docker-compose.yml**

```yaml
services:
  app:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - DATABASE_URL=file:/data/app.db
      - ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
      - JWT_SECRET=${JWT_SECRET:-change-me}
      - WEBHOOK_ENABLED=${WEBHOOK_ENABLED:-false}
    volumes:
      - app-data:/data
    restart: unless-stopped

volumes:
  app-data:
```

**Step 4: 编写 .dockerignore**

```
node_modules
.next
.env.local
*.md
docs/
skills/
用户原始需求输入/
```

**Step 5: 构建测试**

```bash
docker compose build
docker compose up -d
curl http://localhost:3000
```

Expected: 应用正常启动，能访问落地页。

**Step 6: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore docker-entrypoint.sh
git commit -m "feat: add Docker and Docker Compose deployment support"
```

---

## Phase 8: 收尾与质量保障

### Task 26: Webhook 接收端（可选增强）

**Files:**
- Create: `src/app/api/webhook/callback/route.ts`

**要点:**
- 接收 RunningHub TASK_END 回调
- 用 taskId 做幂等键
- 通过 Server-Sent Events (SSE) 推送到前端
- 仅当 SystemConfig `webhook_enabled=true` 时启用
- 先实现基础骨架，可后续完善

**Step: Commit**

```bash
git add src/app/api/webhook/
git commit -m "feat: add webhook callback endpoint skeleton"
```

---

### Task 27: 错误边界与加载状态

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/app/loading.tsx`
- Create: `src/app/workspace/loading.tsx`
- Create: `src/app/workspace/[appId]/loading.tsx`

**要点:**
- 全局 error boundary: 友好的错误页面 + 重试按钮
- 404 页面: "页面不存在" + 返回首页
- loading 骨架屏: 使用 shadcn Skeleton 组件
- 每个关键页面有独立的 loading.tsx

**Step: Commit**

```bash
git add src/app/error.tsx src/app/not-found.tsx src/app/loading.tsx src/app/workspace/loading.tsx src/app/workspace/[appId]/loading.tsx
git commit -m "feat: add error boundaries, 404 page, and loading skeletons"
```

---

### Task 28: 响应式与移动端适配

**要点:**
- 所有页面移动端响应式
- Sidebar 在移动端收起为 Sheet（汉堡菜单）
- 工作区左右分栏在移动端变为上下堆叠
- 图片上传在移动端支持拍照
- 测试: 使用浏览器 DevTools 模拟移动设备

**Step: Commit**

```bash
git commit -m "feat: add responsive design and mobile adaptation"
```

---

### Task 29: 环境变量文档与 README

**Files:**
- Modify: `.env.example` (确保完整)
- Create: `README.md`

**要点:**
- 项目简介
- 快速开始（开发环境 + Docker）
- 环境变量说明
- 后台管理访问说明
- 添加新 AI 应用的步骤

**Step: Commit**

```bash
git add .env.example README.md
git commit -m "docs: add README and complete env example"
```

---

### Task 30: 端到端冒烟测试

**验证清单:**

1. `pnpm dev` 启动无错误
2. 落地页正常显示
3. 输入 API Key → localStorage 持久化
4. 工作台显示 4 个应用卡片
5. 进入任意工作区 → 表单正确渲染
6. 后台 `/admin/login` → 登录成功
7. 后台应用列表显示 4 个应用
8. 后台 curl 解析功能正常
9. 后台 Key 倍率增删改正常
10. Docker 构建 & 运行正常
11. 移动端响应式正常

如有真实 API Key 可用:
12. 上传图片 → 返回 fileName
13. 创建任务 → 返回 taskId
14. 轮询 → 最终 SUCCESS
15. 结果图片可预览和下载

**Step: 修复发现的问题后 Commit**

```bash
git commit -m "test: complete end-to-end smoke testing and fixes"
```

---

## 依赖关系图

```
Phase 1 (Task 1-4)  → 基础设施，无依赖
        ↓
Phase 2 (Task 5-7)  → 后台 API，依赖 Phase 1
Phase 3 (Task 8-10) → 代理 API，依赖 Phase 1
        ↓ (Phase 2 & 3 可并行)
Phase 4 (Task 11-14) → 前端基础，依赖 Phase 1
        ↓
Phase 5 (Task 15-19) → 用户页面，依赖 Phase 3 & 4
Phase 6 (Task 20-24) → 管理页面，依赖 Phase 2 & 4
        ↓ (Phase 5 & 6 可并行)
Phase 7 (Task 25)    → 部署，依赖 Phase 5 & 6
Phase 8 (Task 26-30) → 收尾，依赖全部
```

## 并行执行建议

以下任务组可以并行执行（使用 subagent-driven-development）:

- **并行组 A**: Task 5-7 (后台 API) ‖ Task 8-10 (代理 API)
- **并行组 B**: Task 15-19 (用户页面) ‖ Task 20-24 (管理页面)
