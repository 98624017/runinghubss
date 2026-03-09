import { readFile } from 'node:fs/promises';

const APP_API_DIR = new URL('../../app-source-pages/', import.meta.url);

export const APP_PRESETS = {
  '1994388299756212225': {
    appId: '1994388299756212225',
    title: '室内设计平面图填色-立体版',
    inputKeys: ['257:image'],
    promptKey: '253:text',
    staticOverrides: {
      '260:width': '1600',
      '260:height': '1600',
    },
    recommendedPrompt:
      'Convert the 2D floor plan into a clean 3D interior render with realistic lighting, soft shadows, warm wood flooring, light gray walls, and keep the original room layout and furniture positions unchanged.',
  },
  '1986819253754130433': {
    appId: '1986819253754130433',
    title: 'Missa_建筑景观_风格迁移_效果图专用',
    inputKeys: ['1:image', '403:image'],
    promptKey: null,
    staticOverrides: {},
    recommendedPrompt: null,
  },
  '2003678561775067138': {
    appId: '2003678561775067138',
    title: '🍌香蕉  2 & Pro9图任意融合',
    inputKeys: [
      '3:image',
      '7:image',
      '8:image',
      '11:image',
      '12:image',
      '13:image',
      '14:image',
      '15:image',
      '18:image',
    ],
    promptKey: '2:prompt',
    staticOverrides: {},
    recommendedPrompt:
      '根据第一张户型平面图生成写实室内效果图，保留空间布局与视角关系，并融合其余参考图中的沙发、吊顶、电视墙、灯具、窗户、地板、背景墙和绿植风格。',
  },
  '2023563076041183233': {
    appId: '2023563076041183233',
    title: '毛坯房出图-全能版',
    inputKeys: ['541:image', '538:image'],
    promptKey: '558:text',
    staticOverrides: {
      '605:aspectRatio': 'auto',
      '605:resolution': '2k',
      '605:channel': 'Third-party',
    },
    recommendedPrompt:
      '现代奶油风客厅，保留原始空间结构，左侧电视背景墙，右侧沙发，写实软装效果。',
  },
};

export async function loadDemoJson(appId) {
  const source = await readFile(new URL(`${appId}-api-demo.json`, APP_API_DIR), 'utf8');
  return JSON.parse(source);
}

export function buildAppOverrides(
  appId,
  {
    uploadedAssets,
    prompt = null,
  },
) {
  const preset = APP_PRESETS[appId];
  if (!preset) {
    throw new Error(`不支持的应用 ID：${appId}`);
  }
  if (uploadedAssets.length < preset.inputKeys.length) {
    throw new Error(`${preset.title} 需要至少 ${preset.inputKeys.length} 个资源，当前仅提供 ${uploadedAssets.length} 个。`);
  }

  const overrides = { ...preset.staticOverrides };
  preset.inputKeys.forEach((key, index) => {
    overrides[key] = uploadedAssets[index];
  });

  if (preset.promptKey) {
    overrides[preset.promptKey] = prompt ?? preset.recommendedPrompt ?? '';
  }
  return overrides;
}

export function listSupportedAppIds() {
  return Object.keys(APP_PRESETS);
}
