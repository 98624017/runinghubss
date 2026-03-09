#!/usr/bin/env bash
set -euo pipefail

# 使用 Node.js SDK 对单个 AI 应用做真实闭环验证。
# 用法：
#   RUNNINGHUB_API_KEY=xxx ./scripts/validate/run_node_app_validation.sh 1994388299756212225
#   RUNNINGHUB_API_KEY=xxx ./scripts/validate/run_node_app_validation.sh 1994388299756212225 ./custom.json

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "用法: RUNNINGHUB_API_KEY=xxx $0 <app-id> [output-json]" >&2
  exit 1
fi

if [[ -z "${RUNNINGHUB_API_KEY:-}" ]]; then
  echo "缺少环境变量 RUNNINGHUB_API_KEY" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_dir="$(cd "${script_dir}/../.." && pwd)"
manifest_path="${skill_dir}/assets/test-inputs/manifest.json"
output_dir="${skill_dir}/assets/validation"
app_id="$1"
output_json="${2:-${output_dir}/app-${app_id}-node.json}"
poll_interval="${RUNNINGHUB_POLL_INTERVAL:-12}"
timeout_seconds="${RUNNINGHUB_TIMEOUT_SECONDS:-1800}"

mkdir -p "${output_dir}"

RUNNINGHUB_SKILL_DIR="${skill_dir}" \
RUNNINGHUB_MANIFEST_PATH="${manifest_path}" \
RUNNINGHUB_OUTPUT_JSON="${output_json}" \
RUNNINGHUB_APP_ID="${app_id}" \
RUNNINGHUB_POLL_INTERVAL="${poll_interval}" \
RUNNINGHUB_TIMEOUT_SECONDS="${timeout_seconds}" \
node --input-type=module <<'NODE'
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/u, 'Z');
}

function redactPayload(value, apiKey) {
  if (Array.isArray(value)) {
    return value.map((item) => redactPayload(item, apiKey));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (key === 'apiKey') {
          return [key, '<RUNNINGHUB_API_KEY>'];
        }
        return [key, redactPayload(item, apiKey)];
      }),
    );
  }
  if (typeof value === 'string') {
    return value.replaceAll(apiKey, '<RUNNINGHUB_API_KEY>');
  }
  return value;
}

const skillDir = process.env.RUNNINGHUB_SKILL_DIR;
const manifestPath = process.env.RUNNINGHUB_MANIFEST_PATH;
const outputJson = process.env.RUNNINGHUB_OUTPUT_JSON;
const appId = process.env.RUNNINGHUB_APP_ID;
const pollInterval = Number(process.env.RUNNINGHUB_POLL_INTERVAL);
const timeoutSeconds = Number(process.env.RUNNINGHUB_TIMEOUT_SECONDS);
const apiKey = process.env.RUNNINGHUB_API_KEY;
const sdkDir = resolve(skillDir, 'assets', 'sdk', 'node');

const { buildAppOverrides } = await import(pathToFileURL(resolve(sdkDir, 'app-presets.mjs')).href);
const { AiAppRunner } = await import(pathToFileURL(resolve(sdkDir, 'quick-create-client.mjs')).href);
const { RunningHubClient } = await import(pathToFileURL(resolve(sdkDir, 'runninghub-client.mjs')).href);

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const appCase = manifest?.apps?.[appId] ?? manifest?.appRuns?.[appId];
if (!appCase) {
  throw new Error(`manifest 中不存在应用 ${appId}`);
}

const assetsDir = resolve(skillDir, 'assets', 'test-inputs');
const localFiles = (appCase.files ?? []).map((name) => resolve(assetsDir, name));

const client = new RunningHubClient({ apiKey });
const runner = new AiAppRunner(client);

const uploadedAssets = [];
for (const filePath of localFiles) {
  const uploadResult = await client.uploadFile(filePath);
  const fileName = uploadResult?.data?.fileName;
  if (!fileName) {
    throw new Error(`上传失败：${JSON.stringify(uploadResult)}`);
  }
  uploadedAssets.push({
    localFile: basename(filePath),
    uploadedFileName: fileName,
    uploadResult,
  });
}

const overrides = buildAppOverrides(appId, {
  uploadedAssets: uploadedAssets.map((item) => item.uploadedFileName),
  prompt: appCase.prompt ?? null,
});
Object.assign(overrides, appCase.nodeOverrides ?? {});

const startedAt = nowIso();
const result = await runner.runAndWait(appId, {
  nodeOverrides: overrides,
  pollIntervalMs: pollInterval * 1000,
  timeoutMs: timeoutSeconds * 1000,
  instanceType: appCase.instanceType ?? undefined,
});
const finishedAt = nowIso();

const record = {
  sdk: 'node',
  appId,
  startedAt,
  finishedAt,
  manifestPrompt: appCase.prompt ?? null,
  manifestFiles: localFiles.map((filePath) => basename(filePath)),
  manifestRationale: appCase.rationale ?? null,
  manifestNodeOverrides: appCase.nodeOverrides ?? null,
  manifestInstanceType: appCase.instanceType ?? null,
  uploadedAssets,
  result,
};
const sanitizedRecord = redactPayload(record, apiKey);

await mkdir(dirname(outputJson), { recursive: true });
await writeFile(outputJson, `${JSON.stringify(sanitizedRecord, null, 2)}\n`, 'utf8');

process.stdout.write(`${JSON.stringify({
  sdk: sanitizedRecord.sdk,
  appId: sanitizedRecord.appId,
  taskId: sanitizedRecord?.result?.submit?.data?.taskId,
  outputPath: outputJson,
  finalState: sanitizedRecord?.result?.final?.finalState,
}, null, 2)}\n`);
NODE
