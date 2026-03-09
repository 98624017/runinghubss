import "dotenv/config";
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
