import type { AppDefinition, SupportedAppId } from '../../types';

export const DEFAULT_APP_ID: SupportedAppId = '1994388299756212225';

export const COLOR_PLAN_PROMPT_PRESETS = [
  'Convert the 2D floor plan into a detailed 3D colored plan with realistic lighting and natural shadows while preserving the exact room layout, architectural elements, furniture positions and spatial structure.',
  'Transform the floor plan into a clean colored presentation plan, keep the original layout accurate, and enhance the readability of furniture, partitions and circulation.',
];

export const FLOORPLAN_RENDER_PROMPT_PRESETS = [
  '根据第一张户型平面图生成写实室内效果图，保留空间布局与视角关系，并融合其余参考图中的沙发、吊顶、电视墙、灯具、窗户、地板、背景墙和绿植风格。',
  '根据平面图生成客厅写实效果图，保持结构和动线不变，综合多张参考图完成软装、灯光、材质与景观氛围。',
];

export const ROUGH_ROOM_PROMPT_PRESETS = [
  '现代奶油风客厅，保留原始空间结构，左侧电视背景墙，右侧沙发，写实软装效果。',
  '现代轻奢客厅，保留毛坯房原始结构与开窗位置，补齐吊顶、地面、沙发、灯具与背景墙设计。',
];

const ASPECT_RATIO_PRESETS = ['auto', '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const RESOLUTION_PRESETS = ['1k', '2k', '4k', '8k (Official only)'];
const CHANNEL_PRESETS = ['Third-party', 'Official'];

export const APPS: AppDefinition[] = [
  {
    id: '1994388299756212225',
    slug: 'color-plan',
    title: '一键彩平',
    shortTitle: '一键彩平',
    description: '上传平面图，一键生成彩平展示图，适合方案汇报和空间功能说明。',
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
        defaultValue: COLOR_PLAN_PROMPT_PRESETS[0],
        presets: COLOR_PLAN_PROMPT_PRESETS,
        multiline: true,
        control: 'textarea',
        rows: 4,
        group: '创作说明',
        sectionKey: 'brief',
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
    layoutSchema: {
      sections: [
        { key: 'materials', title: '上传素材', sortOrder: 1 },
        { key: 'brief', title: '创作说明', sortOrder: 2 },
        { key: 'settings', title: '输出设置', sortOrder: 3 },
      ],
    },
    resultSchema: {
      sections: [
        {
          key: 'result',
          title: '结果说明',
          tips: ['结果链接可能失效，请及时下载', '彩平图适合方案汇报与空间说明'],
        },
      ],
    },
  },
  {
    id: '1986819253754130433',
    slug: 'exterior-transfer',
    title: '外观迁移',
    shortTitle: '外观迁移',
    description: '上传原始图与风格参考图，提取建筑或景观风格并完成外观迁移。',
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
    layoutSchema: {
      sections: [
        { key: 'materials', title: '主体素材', sortOrder: 1 },
        { key: 'references', title: '参考素材', sortOrder: 2 },
      ],
    },
    resultSchema: {
      sections: [
        {
          key: 'result',
          title: '结果说明',
          tips: ['结果链接可能失效，请及时下载', '建议使用清晰的原始图与强风格参考图'],
        },
      ],
    },
  },
  {
    id: '2003678561775067138',
    slug: 'floorplan-to-render',
    title: '平面转效果',
    shortTitle: '平面转效果',
    description: '基于平面图与多张参考图，生成完整的室内写实效果图。',
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
        defaultValue: FLOORPLAN_RENDER_PROMPT_PRESETS[0],
        presets: FLOORPLAN_RENDER_PROMPT_PRESETS,
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
    layoutSchema: {
      sections: [
        { key: 'brief', title: '创作说明', sortOrder: 1 },
        { key: 'materials', title: '基础素材', sortOrder: 2 },
        { key: 'references', title: '参考素材', sortOrder: 3 },
      ],
    },
    resultSchema: {
      sections: [
        {
          key: 'result',
          title: '结果说明',
          tips: ['结果链接可能失效，请及时下载', '建议先补齐参考图，再提交生成任务'],
        },
      ],
    },
  },
  {
    id: '2023563076041183233',
    slug: 'rough-to-render',
    title: '毛坯转效果',
    shortTitle: '毛坯转效果',
    description: '上传毛坯照片与风格参考，快速生成装修后的空间效果图。',
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
        defaultValue: ROUGH_ROOM_PROMPT_PRESETS[0],
        presets: ROUGH_ROOM_PROMPT_PRESETS,
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
        presets: ASPECT_RATIO_PRESETS,
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
        presets: RESOLUTION_PRESETS,
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
        presets: CHANNEL_PRESETS,
        group: '输出设置',
        sectionKey: 'settings',
        sortOrder: 6,
      },
    ],
    layoutSchema: {
      sections: [
        { key: 'materials', title: '主体素材', sortOrder: 1 },
        { key: 'references', title: '参考素材', sortOrder: 2 },
        { key: 'brief', title: '创作说明', sortOrder: 3 },
        { key: 'settings', title: '输出设置', sortOrder: 4 },
      ],
    },
    resultSchema: {
      sections: [
        {
          key: 'result',
          title: '结果说明',
          tips: ['结果链接可能失效，请及时下载', '默认第三方渠道更适合日常出图成本控制'],
        },
      ],
    },
  },
];

export function getAppById(appId: SupportedAppId, apps: AppDefinition[] = APPS) {
  return apps.find((item) => item.id === appId) ?? apps[0] ?? APPS[0];
}

export function findAppById(apps: AppDefinition[], appId: SupportedAppId) {
  return apps.find((item) => item.id === appId) ?? apps[0] ?? APPS[0];
}

export function findAppBySlug(apps: AppDefinition[], slug: string) {
  return apps.find((item) => item.slug === slug) ?? null;
}
