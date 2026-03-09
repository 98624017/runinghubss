import { badRequest } from '../errors.js';

export type SupportedAppId =
  | '2011111632956563457'
  | '1993737411698032641'
  | '1994388299756212225'
  | '1986819253754130433'
  | '2003678561775067138'
  | '2023563076041183233';

export type AppFieldType = 'file' | 'boolean' | 'text';

export interface AppFieldDefinition {
  key: string;
  label: string;
  type: AppFieldType;
  description: string;
  required: boolean;
  accept?: string;
  defaultValue?: string | boolean;
  presets?: string[];
  group?: string;
  sectionKey?: string;
  control?: 'textarea' | 'input';
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
  sortOrder?: number;
}

export interface SupportedAppDefinition {
  id: SupportedAppId;
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  tags: string[];
  chips: string[];
  notes: string[];
  nodeSummary: string[];
  fields: AppFieldDefinition[];
  buildNodeInfoList: (input: {
    uploadedFiles: Record<string, string | undefined>;
    formValues: Record<string, string | boolean | undefined>;
  }) => Array<{ nodeId: string; fieldName: string; fieldValue: string }>;
}

const upscalePromptPresets = [
  '高清恢复图片，消除像素模糊和色块失真，使图片细节清晰饱满，保持主体一致性。',
  '提升图片清晰度与纹理细节，减少噪点与压缩痕迹，保持自然色彩。',
  '对图片进行高质量超分与锐化增强，保留真实边缘与材质细节。',
];

const colorPlanPromptPresets = [
  'Convert the 2D floor plan into a detailed 3D colored plan with realistic lighting and natural shadows while preserving the exact room layout, architectural elements, furniture positions and spatial structure.',
  'Transform the floor plan into a clean colored presentation plan, keep the original layout accurate, and enhance the readability of furniture, partitions and circulation.',
];

const floorplanRenderPromptPresets = [
  '根据第一张户型平面图生成写实室内效果图，保留空间布局与视角关系，并融合其余参考图中的沙发、吊顶、电视墙、灯具、窗户、地板、背景墙和绿植风格。',
  '根据平面图生成客厅写实效果图，保持结构和动线不变，综合多张参考图完成软装、灯光、材质与景观氛围。',
];

const roughRoomPromptPresets = [
  '现代奶油风客厅，保留原始空间结构，左侧电视背景墙，右侧沙发，写实软装效果。',
  '现代轻奢客厅，保留毛坯房原始结构与开窗位置，补齐吊顶、地面、沙发、灯具与背景墙设计。',
];

const aspectRatioPresets = ['auto', '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const resolutionPresets = ['1k', '2k', '4k', '8k (Official only)'];
const channelPresets = ['Third-party', 'Official'];

const DEFAULT_PUBLIC_APP_IDS: SupportedAppId[] = [
  '1994388299756212225',
  '1986819253754130433',
  '2003678561775067138',
  '2023563076041183233',
];

export const SUPPORTED_APPS: Record<SupportedAppId, SupportedAppDefinition> = {
  '2011111632956563457': {
    id: '2011111632956563457',
    slug: 'upscale-fast',
    label: '极速高清放大',
    shortLabel: '高清放大',
    description: '上传图片后快速做高清放大，默认 4K，可选开启 8K。',
    tags: ['图片放大', '4K', '8K'],
    chips: ['单图输入', '4K/8K 切换', '极速增强'],
    notes: ['默认 4K，打开开关后尝试 8K。', '适合演示图、截图、设计稿的快速清晰化。'],
    nodeSummary: ['308:image', '306:value(Boolean)'],
    fields: [
      {
        key: 'file',
        label: '上传图片',
        type: 'file',
        description: '支持常见图片格式，系统会自动完成资源上传。',
        required: true,
        accept: 'image/*',
        group: '上传素材',
        sectionKey: 'materials',
        sortOrder: 1,
      },
      {
        key: 'enable8k',
        label: '开启 8K',
        type: 'boolean',
        description: '关闭时默认走 4K，开启后尝试 8K 输出。',
        required: false,
        defaultValue: false,
        group: '输出设置',
        sectionKey: 'settings',
        sortOrder: 2,
      },
    ],
    buildNodeInfoList: ({ uploadedFiles, formValues }) => [
      { nodeId: '308', fieldName: 'image', fieldValue: String(uploadedFiles.file || '') },
      {
        nodeId: '306',
        fieldName: 'value',
        fieldValue: formValues.enable8k ? 'true' : 'false',
      },
    ],
  },
  '1993737411698032641': {
    id: '1993737411698032641',
    slug: 'detail-upscale',
    label: '全能图片增强',
    shortLabel: '图片增强',
    description: '上传图片并输入增强提示词，完成去糊、超分与细节恢复。',
    tags: ['超分', '修复', '文本控制'],
    chips: ['单图输入', '文本增强', '细节控制'],
    notes: ['建议优先使用简洁中文提示词。', '适合人像、产品图和高压缩图像修复。'],
    nodeSummary: ['22:image', '43:text(String)'],
    fields: [
      {
        key: 'file',
        label: '上传图片',
        type: 'file',
        description: '建议上传待增强的原始图片。',
        required: true,
        accept: 'image/*',
        group: '上传素材',
        sectionKey: 'materials',
        sortOrder: 1,
      },
      {
        key: 'prompt',
        label: '增强提示词',
        type: 'text',
        description: '描述你想要的增强效果，例如锐化、去噪、人像恢复等。',
        required: false,
        defaultValue: upscalePromptPresets[0],
        presets: [...upscalePromptPresets],
        group: '创作参数',
        sectionKey: 'settings',
        multiline: true,
        control: 'textarea',
        rows: 4,
        sortOrder: 2,
      },
    ],
    buildNodeInfoList: ({ uploadedFiles, formValues }) => [
      { nodeId: '22', fieldName: 'image', fieldValue: String(uploadedFiles.file || '') },
      {
        nodeId: '43',
        fieldName: 'text',
        fieldValue: String(formValues.prompt || upscalePromptPresets[0]),
      },
    ],
  },
  '1994388299756212225': {
    id: '1994388299756212225',
    slug: 'color-plan',
    label: '一键彩平',
    shortLabel: '一键彩平',
    description: '上传平面图，一键生成彩平展示图，适合方案汇报和空间功能说明。',
    tags: ['彩平', '平面图', '室内设计'],
    chips: ['单图输入', '彩平输出', '尺寸可控'],
    notes: ['适合方案前期汇报与空间布局说明。', '如无特殊需求，建议保留默认英文提示词。'],
    nodeSummary: ['257:image', '253:text(String)', '260:width', '260:height'],
    fields: [
      {
        key: 'file',
        label: '上传平面图',
        type: 'file',
        description: '上传平面白图或结构清晰的平面图。',
        required: true,
        accept: 'image/*',
        group: '上传素材',
        sectionKey: 'materials',
        sortOrder: 1,
      },
      {
        key: 'prompt',
        label: '风格提示',
        type: 'text',
        description: '可沿用默认英文提示词，主要用于控制彩平表现方式。',
        required: true,
        defaultValue: colorPlanPromptPresets[0],
        presets: [...colorPlanPromptPresets],
        multiline: true,
        control: 'textarea',
        rows: 4,
        group: '创作参数',
        sectionKey: 'settings',
        sortOrder: 2,
      },
      {
        key: 'width',
        label: '输出宽度',
        type: 'text',
        description: '建议与输出高度保持一致。',
        required: true,
        defaultValue: '1600',
        presets: ['1200', '1600', '2048'],
        group: '输出设置',
        sectionKey: 'settings',
        sortOrder: 3,
      },
      {
        key: 'height',
        label: '输出高度',
        type: 'text',
        description: '建议与输出宽度保持一致。',
        required: true,
        defaultValue: '1600',
        presets: ['1200', '1600', '2048'],
        group: '输出设置',
        sectionKey: 'settings',
        sortOrder: 4,
      },
    ],
    buildNodeInfoList: ({ uploadedFiles, formValues }) => [
      { nodeId: '257', fieldName: 'image', fieldValue: String(uploadedFiles.file || '') },
      {
        nodeId: '253',
        fieldName: 'text',
        fieldValue: String(formValues.prompt || colorPlanPromptPresets[0]),
      },
      {
        nodeId: '260',
        fieldName: 'width',
        fieldValue: String(formValues.width || '1600'),
      },
      {
        nodeId: '260',
        fieldName: 'height',
        fieldValue: String(formValues.height || '1600'),
      },
    ],
  },
  '1986819253754130433': {
    id: '1986819253754130433',
    slug: 'exterior-transfer',
    label: '外观迁移',
    shortLabel: '外观迁移',
    description: '上传原始图与风格参考图，提取建筑或景观风格并完成外观迁移。',
    tags: ['风格迁移', '建筑外观', '双图输入'],
    chips: ['双图输入', '外观参考', '快速迁移'],
    notes: ['适合建筑外立面、景观氛围和材质风格迁移。', '第二张图用于提取色调、材质和氛围。'],
    nodeSummary: ['1:image', '403:image'],
    fields: [
      {
        key: 'sourceImage',
        label: '上传原始图',
        type: 'file',
        description: '上传你的原始建筑或景观图像。',
        required: true,
        accept: 'image/*',
        group: '主体素材',
        sectionKey: 'materials',
        sortOrder: 1,
      },
      {
        key: 'styleImage',
        label: '上传风格参考',
        type: 'file',
        description: '上传你希望提取风格的参考图。',
        required: true,
        accept: 'image/*',
        group: '参考素材',
        sectionKey: 'references',
        sortOrder: 2,
      },
    ],
    buildNodeInfoList: ({ uploadedFiles }) => [
      { nodeId: '1', fieldName: 'image', fieldValue: String(uploadedFiles.sourceImage || '') },
      { nodeId: '403', fieldName: 'image', fieldValue: String(uploadedFiles.styleImage || '') },
    ],
  },
  '2003678561775067138': {
    id: '2003678561775067138',
    slug: 'floorplan-to-render',
    label: '平面转效果',
    shortLabel: '平面转效果',
    description: '基于平面图与多张参考图，生成完整的室内写实效果图。',
    tags: ['平面图', '多图参考', '效果图'],
    chips: ['九图参考', '写实效果', '室内空间'],
    notes: ['第一张必须是平面图，其余图片用于对应软装与材质参考。', '建议一次性补齐全部参考素材，确保输出稳定。'],
    nodeSummary: ['2:prompt', '3:image', '7:image', '8:image', '11:image', '12:image', '13:image', '14:image', '15:image', '18:image'],
    fields: [
      {
        key: 'prompt',
        label: '生成说明',
        type: 'text',
        description: '描述取景方向和各张参考图对应的软装元素。',
        required: true,
        defaultValue: floorplanRenderPromptPresets[0],
        presets: [...floorplanRenderPromptPresets],
        multiline: true,
        control: 'textarea',
        rows: 5,
        group: '创作说明',
        sectionKey: 'brief',
        sortOrder: 1,
      },
      {
        key: 'planImage',
        label: '平面图',
        type: 'file',
        description: '第 1 张图，决定空间布局与取景方向。',
        required: true,
        accept: 'image/*',
        group: '基础素材',
        sectionKey: 'materials',
        sortOrder: 2,
      },
      {
        key: 'sofaReference',
        label: '沙发参考',
        type: 'file',
        description: '第 2 张图，参考沙发造型与摆位。',
        required: true,
        accept: 'image/*',
        group: '参考素材',
        sectionKey: 'references',
        sortOrder: 3,
      },
      {
        key: 'ceilingReference',
        label: '吊顶参考',
        type: 'file',
        description: '第 3 张图，参考吊顶造型与层次。',
        required: true,
        accept: 'image/*',
        group: '参考素材',
        sectionKey: 'references',
        sortOrder: 4,
      },
      {
        key: 'tvWallReference',
        label: '电视墙参考',
        type: 'file',
        description: '第 4 张图，参考电视与背景墙设计。',
        required: true,
        accept: 'image/*',
        group: '参考素材',
        sectionKey: 'references',
        sortOrder: 5,
      },
      {
        key: 'chandelierReference',
        label: '吊灯参考',
        type: 'file',
        description: '第 5 张图，参考主灯与氛围灯具。',
        required: true,
        accept: 'image/*',
        group: '参考素材',
        sectionKey: 'references',
        sortOrder: 6,
      },
      {
        key: 'windowReference',
        label: '窗户参考',
        type: 'file',
        description: '第 6 张图，参考窗型、窗帘与采光氛围。',
        required: true,
        accept: 'image/*',
        group: '参考素材',
        sectionKey: 'references',
        sortOrder: 7,
      },
      {
        key: 'floorReference',
        label: '地板参考',
        type: 'file',
        description: '第 7 张图，参考地面材质与拼接方式。',
        required: true,
        accept: 'image/*',
        group: '参考素材',
        sectionKey: 'references',
        sortOrder: 8,
      },
      {
        key: 'wallReference',
        label: '背景墙参考',
        type: 'file',
        description: '第 8 张图，参考沙发背景与墙面材质。',
        required: true,
        accept: 'image/*',
        group: '参考素材',
        sectionKey: 'references',
        sortOrder: 9,
      },
      {
        key: 'plantReference',
        label: '绿植参考',
        type: 'file',
        description: '第 9 张图，参考绿植与陈设氛围。',
        required: true,
        accept: 'image/*',
        group: '参考素材',
        sectionKey: 'references',
        sortOrder: 10,
      },
    ],
    buildNodeInfoList: ({ uploadedFiles, formValues }) => [
      {
        nodeId: '2',
        fieldName: 'prompt',
        fieldValue: String(formValues.prompt || floorplanRenderPromptPresets[0]),
      },
      { nodeId: '3', fieldName: 'image', fieldValue: String(uploadedFiles.planImage || '') },
      { nodeId: '7', fieldName: 'image', fieldValue: String(uploadedFiles.sofaReference || '') },
      { nodeId: '8', fieldName: 'image', fieldValue: String(uploadedFiles.ceilingReference || '') },
      { nodeId: '11', fieldName: 'image', fieldValue: String(uploadedFiles.tvWallReference || '') },
      { nodeId: '12', fieldName: 'image', fieldValue: String(uploadedFiles.chandelierReference || '') },
      { nodeId: '13', fieldName: 'image', fieldValue: String(uploadedFiles.windowReference || '') },
      { nodeId: '14', fieldName: 'image', fieldValue: String(uploadedFiles.floorReference || '') },
      { nodeId: '15', fieldName: 'image', fieldValue: String(uploadedFiles.wallReference || '') },
      { nodeId: '18', fieldName: 'image', fieldValue: String(uploadedFiles.plantReference || '') },
    ],
  },
  '2023563076041183233': {
    id: '2023563076041183233',
    slug: 'rough-to-render',
    label: '毛坯转效果',
    shortLabel: '毛坯转效果',
    description: '上传毛坯照片与风格参考，快速生成装修后的空间效果图。',
    tags: ['毛坯房', '效果图', '双图参考'],
    chips: ['双图输入', '风格控制', '分辨率可选'],
    notes: ['适合毛坯房、空房和待装修空间的快速设计表达。', '默认使用第三方渠道和 2k 分辨率，可按需调整。'],
    nodeSummary: ['541:image', '538:image', '558:text', '605:aspectRatio', '605:resolution', '605:channel'],
    fields: [
      {
        key: 'sourceImage',
        label: '上传毛坯照片',
        type: 'file',
        description: '上传需要改造的毛坯房或空房照片。',
        required: true,
        accept: 'image/*',
        group: '主体素材',
        sectionKey: 'materials',
        sortOrder: 1,
      },
      {
        key: 'styleImage',
        label: '上传风格参考',
        type: 'file',
        description: '上传目标风格、软装或空间氛围参考图。',
        required: true,
        accept: 'image/*',
        group: '参考素材',
        sectionKey: 'references',
        sortOrder: 2,
      },
      {
        key: 'prompt',
        label: '装修说明',
        type: 'text',
        description: '描述装修风格、家具布局和空间重点。',
        required: false,
        defaultValue: roughRoomPromptPresets[0],
        presets: [...roughRoomPromptPresets],
        multiline: true,
        control: 'textarea',
        rows: 4,
        group: '创作说明',
        sectionKey: 'brief',
        sortOrder: 3,
      },
      {
        key: 'aspectRatio',
        label: '出图比例',
        type: 'text',
        description: '选择输出图像比例。',
        required: true,
        defaultValue: 'auto',
        presets: [...aspectRatioPresets],
        group: '输出设置',
        sectionKey: 'settings',
        sortOrder: 4,
      },
      {
        key: 'resolution',
        label: '出图分辨率',
        type: 'text',
        description: '默认 2k，分辨率越高消耗越高。',
        required: true,
        defaultValue: '2k',
        presets: [...resolutionPresets],
        group: '输出设置',
        sectionKey: 'settings',
        sortOrder: 5,
      },
      {
        key: 'channel',
        label: '渠道选择',
        type: 'text',
        description: '默认 Third-party，成本更低。',
        required: true,
        defaultValue: 'Third-party',
        presets: [...channelPresets],
        group: '输出设置',
        sectionKey: 'settings',
        sortOrder: 6,
      },
    ],
    buildNodeInfoList: ({ uploadedFiles, formValues }) => [
      { nodeId: '541', fieldName: 'image', fieldValue: String(uploadedFiles.sourceImage || '') },
      { nodeId: '538', fieldName: 'image', fieldValue: String(uploadedFiles.styleImage || '') },
      {
        nodeId: '558',
        fieldName: 'text',
        fieldValue: String(formValues.prompt || roughRoomPromptPresets[0]),
      },
      {
        nodeId: '605',
        fieldName: 'aspectRatio',
        fieldValue: String(formValues.aspectRatio || 'auto'),
      },
      {
        nodeId: '605',
        fieldName: 'resolution',
        fieldValue: String(formValues.resolution || '2k'),
      },
      {
        nodeId: '605',
        fieldName: 'channel',
        fieldValue: String(formValues.channel || 'Third-party'),
      },
    ],
  },
};

export function listSupportedApps(): SupportedAppDefinition[] {
  return Object.values(SUPPORTED_APPS);
}

export function listPublicSupportedApps(): SupportedAppDefinition[] {
  return DEFAULT_PUBLIC_APP_IDS.map((appId) => SUPPORTED_APPS[appId]);
}

export function getSupportedApp(appId: string): SupportedAppDefinition {
  const app = SUPPORTED_APPS[appId as SupportedAppId];
  if (!app) {
    throw badRequest(`不支持的应用：${appId}`);
  }
  return app;
}

export function getPromptPresets(): string[] {
  return [
    ...upscalePromptPresets,
    ...colorPlanPromptPresets,
    ...floorplanRenderPromptPresets,
    ...roughRoomPromptPresets,
  ];
}
