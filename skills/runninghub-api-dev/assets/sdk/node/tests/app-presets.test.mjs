import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APP_PRESETS,
  buildAppOverrides,
  listSupportedAppIds,
} from '../app-presets.mjs';

test('应列出四个预置应用', () => {
  assert.equal(listSupportedAppIds().length, 4);
});

test('应为平面图应用构造节点覆盖值', () => {
  const overrides = buildAppOverrides('1994388299756212225', {
    uploadedAssets: ['openapi/demo-floorplan.png'],
    prompt: 'test prompt',
  });

  assert.equal(overrides['257:image'], 'openapi/demo-floorplan.png');
  assert.equal(overrides['253:text'], 'test prompt');
  assert.equal(overrides['260:width'], '1600');
});

test('当资源不足时应报错', () => {
  assert.equal(APP_PRESETS['1986819253754130433'].inputKeys.length, 2);
  assert.throws(
    () => buildAppOverrides('1986819253754130433', {
      uploadedAssets: ['openapi/only-one.png'],
    }),
    /需要至少 2 个资源/u,
  );
});
