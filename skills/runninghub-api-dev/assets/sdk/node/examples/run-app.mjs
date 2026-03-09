import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { APP_PRESETS, buildAppOverrides } from '../app-presets.mjs';
import { AiAppRunner } from '../quick-create-client.mjs';
import { RunningHubClient } from '../runninghub-client.mjs';

function parseArgs(argv) {
  const args = {
    files: [],
    prompt: null,
    saveJson: null,
    pollIntervalMs: 12_000,
    timeoutMs: 1_800_000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--app-id') {
      args.appId = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--file') {
      args.files.push(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--prompt') {
      args.prompt = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--save-json') {
      args.saveJson = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--poll-interval-ms') {
      args.pollIntervalMs = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--timeout-ms') {
      args.timeoutMs = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }
    throw new Error(`未知参数：${token}`);
  }
  return args;
}

function printHelp() {
  console.log(`运行 RunningHub AI 应用示例

用法：
  node run-app.mjs --app-id <id> --file <path> [--file <path> ...]

参数：
  --app-id             必填，四个预置应用之一
  --file               可重复传入，本地输入文件
  --prompt             覆盖默认提示词
  --save-json          保存执行结果到 JSON 文件
  --poll-interval-ms   轮询间隔，默认 12000
  --timeout-ms         超时时间，默认 1800000
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return 0;
  }
  if (!args.appId || !APP_PRESETS[args.appId]) {
    throw new Error(`缺少或不支持的 --app-id，可选值：${Object.keys(APP_PRESETS).join(', ')}`);
  }
  const apiKey = process.env.RUNNINGHUB_API_KEY;
  if (!apiKey) {
    throw new Error('缺少环境变量 RUNNINGHUB_API_KEY');
  }

  const client = new RunningHubClient({ apiKey });
  const runner = new AiAppRunner(client);

  const uploadedAssets = [];
  for (const filePath of args.files) {
    const uploadResult = await client.uploadFile(filePath);
    const fileName = uploadResult?.data?.fileName;
    if (!fileName) {
      throw new Error(`上传失败：${JSON.stringify(uploadResult)}`);
    }
    uploadedAssets.push(fileName);
  }

  const overrides = buildAppOverrides(args.appId, {
    uploadedAssets,
    prompt: args.prompt,
  });
  const result = await runner.runAndWait(args.appId, {
    nodeOverrides: overrides,
    pollIntervalMs: args.pollIntervalMs,
    timeoutMs: args.timeoutMs,
  });

  const output = `${JSON.stringify(result, null, 2)}\n`;
  process.stdout.write(output);
  if (args.saveJson) {
    await mkdir(path.dirname(args.saveJson), { recursive: true });
    await writeFile(args.saveJson, output, 'utf8');
  }
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(error?.stack ?? String(error));
    process.exitCode = 1;
  },
);
