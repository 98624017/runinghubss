#!/usr/bin/env python3
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.request import urlopen

from PIL import Image


SKILL_ROOT = Path(__file__).resolve().parents[2]
APP_META_PATH = SKILL_ROOT / "assets/app-api-metadata.json"
TEST_INPUT_DIR = SKILL_ROOT / "assets/test-inputs"
RAW_DIR = TEST_INPUT_DIR / "raw"
MANIFEST_PATH = TEST_INPUT_DIR / "manifest.json"


@dataclass(frozen=True)
class SourceSpec:
    source_id: str
    url: str
    filename: str


@dataclass(frozen=True)
class DerivedAssetSpec:
    asset_id: str
    source_id: str
    local_filename: str
    crop_box: tuple[int, int, int, int] | None
    app_ids: tuple[str, ...]
    prompt: str | None
    rationale: str


SOURCE_SPECS = (
    SourceSpec(
        source_id="missa-cover",
        url="https://rh-images.xiaoyaoyou.com/3ddf9a97d6c852bee4660b883096ed34/2026-02-04/a95a11b24d4fad464cb414efc5cf28d1.png",
        filename="raw-missa-cover.png",
    ),
    SourceSpec(
        source_id="floorplan-before-after",
        url="https://rh-images.xiaoyaoyou.com/b5422beb678ad265e3fc0ccd30b4156e/2025-11-28/40eb6f91cb1c6fe26582f4714a6250f0.jpg",
        filename="raw-floorplan-before-after.jpg",
    ),
    SourceSpec(
        source_id="floorplan-render",
        url="https://rh-images.xiaoyaoyou.com/b5422beb678ad265e3fc0ccd30b4156e/2025-11-28/037891511291229374760cec37a2a52b.jpg",
        filename="raw-floorplan-render.jpg",
    ),
    SourceSpec(
        source_id="banana-nine-way",
        url="https://rh-images.xiaoyaoyou.com/a052835e0508f253311899a0d7880d80/2025-12-24/ed75d9d3a82913377a416838c9a2df24.jpg",
        filename="raw-banana-nine-way.jpg",
    ),
    SourceSpec(
        source_id="rough-house-before-after",
        url="https://rh-images.xiaoyaoyou.com/064a677842c55c3b0bc59eb437f7c4f6/2026-02-17/be06e4cdfb4f9ac79c610416358f7d60.jpg",
        filename="raw-rough-house-before-after.jpg",
    ),
)


DERIVED_ASSETS = (
    DerivedAssetSpec(
        asset_id="floorplan-white-source",
        source_id="floorplan-before-after",
        local_filename="floorplan-white-source.jpg",
        crop_box=(475, 0, 983, 998),
        app_ids=("1994388299756212225", "2003678561775067138"),
        prompt=None,
        rationale="从官方封面右半边裁出白底平面图，最贴近“上传平面白图”的输入要求。",
    ),
    DerivedAssetSpec(
        asset_id="missa-original-render",
        source_id="missa-cover",
        local_filename="missa-original-render.png",
        crop_box=(0, 330, 600, 730),
        app_ids=("1986819253754130433",),
        prompt=None,
        rationale="裁出官方封面左上角原始建筑效果图，作为风格迁移的原始图。",
    ),
    DerivedAssetSpec(
        asset_id="missa-style-reference",
        source_id="missa-cover",
        local_filename="missa-style-reference.png",
        crop_box=(600, 330, 1200, 730),
        app_ids=("1986819253754130433",),
        prompt=None,
        rationale="裁出官方封面右上角夜景参考图，用于提供天空、光影与色调风格。",
    ),
    DerivedAssetSpec(
        asset_id="banana-reference-floorplan",
        source_id="banana-nine-way",
        local_filename="banana-reference-floorplan.jpg",
        crop_box=(840, 210, 1175, 700),
        app_ids=("2003678561775067138",),
        prompt="根据第1张平面图生成客厅写实效果图，按红色箭头方向取景；第2张参考沙发组合，第3张参考吊顶，第4张参考吊灯，第5张参考电视背景墙，第6张参考窗户，第7张参考地板，第8张参考沙发背景墙，第9张参考绿植。整体为现代暖木色、奶油风、自然日光。",
        rationale="从官方香蕉应用封面裁出平面图区域，作为多图融合的基础布局输入。",
    ),
    DerivedAssetSpec(
        asset_id="banana-reference-sofa",
        source_id="banana-nine-way",
        local_filename="banana-reference-sofa.jpg",
        crop_box=(55, 668, 332, 820),
        app_ids=("2003678561775067138",),
        prompt=None,
        rationale="裁出沙发组合参考图，用于控制主家具风格。",
    ),
    DerivedAssetSpec(
        asset_id="banana-reference-ceiling",
        source_id="banana-nine-way",
        local_filename="banana-reference-ceiling.jpg",
        crop_box=(290, 20, 885, 155),
        app_ids=("2003678561775067138",),
        prompt=None,
        rationale="裁出吊顶区域，用于控制顶面灯带与层次。",
    ),
    DerivedAssetSpec(
        asset_id="banana-reference-lamp",
        source_id="banana-nine-way",
        local_filename="banana-reference-lamp.jpg",
        crop_box=(972, 10, 1148, 145),
        app_ids=("2003678561775067138",),
        prompt=None,
        rationale="裁出吊灯参考图，用于控制主灯造型。",
    ),
    DerivedAssetSpec(
        asset_id="banana-reference-tv-wall",
        source_id="banana-nine-way",
        local_filename="banana-reference-tv-wall.jpg",
        crop_box=(45, 388, 352, 558),
        app_ids=("2003678561775067138",),
        prompt=None,
        rationale="裁出电视与背景墙区域，用于控制客厅主视觉面。",
    ),
    DerivedAssetSpec(
        asset_id="banana-reference-window",
        source_id="banana-nine-way",
        local_filename="banana-reference-window.jpg",
        crop_box=(55, 28, 208, 120),
        app_ids=("2003678561775067138",),
        prompt=None,
        rationale="裁出窗户区域，用于控制开窗比例与采光风格。",
    ),
    DerivedAssetSpec(
        asset_id="banana-reference-floor",
        source_id="banana-nine-way",
        local_filename="banana-reference-floor.jpg",
        crop_box=(48, 235, 300, 302),
        app_ids=("2003678561775067138",),
        prompt=None,
        rationale="裁出木地板样式，用于约束地面材质与颜色。",
    ),
    DerivedAssetSpec(
        asset_id="banana-reference-bg-wall",
        source_id="banana-nine-way",
        local_filename="banana-reference-bg-wall.jpg",
        crop_box=(458, 628, 760, 742),
        app_ids=("2003678561775067138",),
        prompt=None,
        rationale="裁出沙发背景墙参考图，用于控制墙面线条与材质。",
    ),
    DerivedAssetSpec(
        asset_id="banana-reference-plant",
        source_id="banana-nine-way",
        local_filename="banana-reference-plant.jpg",
        crop_box=(825, 620, 962, 780),
        app_ids=("2003678561775067138",),
        prompt=None,
        rationale="裁出绿植参考图，用于补充软装点缀风格。",
    ),
    DerivedAssetSpec(
        asset_id="rough-house-empty-room",
        source_id="rough-house-before-after",
        local_filename="rough-house-empty-room.jpg",
        crop_box=(0, 0, 640, 435),
        app_ids=("2023563076041183233",),
        prompt="把毛坯房生成现代暖木色客厅效果图，保留窗户位置与空间结构，电视墙在左侧、浅色布艺沙发在右侧、隐藏灯带与大地毯，写实摄影质感。",
        rationale="裁出官方封面左上角毛坯房照片，最接近应用的原始房间输入。",
    ),
    DerivedAssetSpec(
        asset_id="rough-house-style-reference",
        source_id="rough-house-before-after",
        local_filename="rough-house-style-reference.jpg",
        crop_box=(620, 0, 1779, 758),
        app_ids=("2023563076041183233",),
        prompt=None,
        rationale="裁出官方封面右侧完整成品效果图，作为风格与材质参考。",
    ),
)


APP_RUN_PROMPTS = {
    "1994388299756212225": "将该平面白图转换为现代暖木色住宅的俯视立体效果图，保留原始墙体、门窗与家具布局，写实材质与柔和灯光。",
    "2003678561775067138": "根据第1张平面图生成客厅写实效果图，按红色箭头方向取景；第2张参考沙发组合，第3张参考吊顶，第4张参考吊灯，第5张参考电视背景墙，第6张参考窗户，第7张参考地板，第8张参考沙发背景墙，第9张参考绿植。整体为现代暖木色、奶油风、自然日光。",
    "2023563076041183233": "把毛坯房生成现代暖木色客厅效果图，保留窗户位置与空间结构，电视墙在左侧、浅色布艺沙发在右侧、隐藏灯带与大地毯，写实摄影质感。",
}


def load_app_meta() -> dict[str, Any]:
    data = json.loads(APP_META_PATH.read_text(encoding="utf-8"))
    return {item["appId"]: item for item in data}


def download_file(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(url) as response:
        target.write_bytes(response.read())


def crop_image(source: Path, target: Path, crop_box: tuple[int, int, int, int] | None) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        result = image.crop(crop_box) if crop_box else image.copy()
        result.save(target)


def build_manifest(
    app_meta: dict[str, Any],
    source_targets: dict[str, Path],
    derived_targets: dict[str, Path],
) -> dict[str, Any]:
    asset_entries = []
    for spec in DERIVED_ASSETS:
        asset_entries.append(
            {
                "assetId": spec.asset_id,
                "sourceUrl": next(source.url for source in SOURCE_SPECS if source.source_id == spec.source_id),
                "sourceFilename": source_targets[spec.source_id].name,
                "localFilename": derived_targets[spec.asset_id].name,
                "cropBox": list(spec.crop_box) if spec.crop_box else None,
                "appIds": list(spec.app_ids),
                "prompt": spec.prompt,
                "rationale": spec.rationale,
            }
        )

    app_runs = {
        "1994388299756212225": {
            "title": app_meta["1994388299756212225"]["webappName"],
            "recommendedSdk": "node",
            "files": ["floorplan-white-source.jpg"],
            "prompt": APP_RUN_PROMPTS["1994388299756212225"],
            "notes": "单图输入，优先用 Node SDK 做一次真实闭环，顺便覆盖 JS 封装。",
        },
        "1986819253754130433": {
            "title": app_meta["1986819253754130433"]["webappName"],
            "recommendedSdk": "python",
            "files": ["missa-original-render.png", "missa-style-reference.png"],
            "prompt": None,
            "notes": "双图风格迁移，不额外传 prompt。",
        },
        "2003678561775067138": {
            "title": app_meta["2003678561775067138"]["webappName"],
            "recommendedSdk": "python",
            "files": [
                "floorplan-white-source.jpg",
                "banana-reference-sofa.jpg",
                "banana-reference-ceiling.jpg",
                "banana-reference-lamp.jpg",
                "banana-reference-tv-wall.jpg",
                "banana-reference-window.jpg",
                "banana-reference-floor.jpg",
                "banana-reference-bg-wall.jpg",
                "banana-reference-plant.jpg",
            ],
            "prompt": APP_RUN_PROMPTS["2003678561775067138"],
            "notes": "九图全部来自官方封面裁切，保证题材一致且公网来源明确。",
        },
        "2023563076041183233": {
            "title": app_meta["2023563076041183233"]["webappName"],
            "recommendedSdk": "python",
            "files": ["rough-house-empty-room.jpg", "rough-house-style-reference.jpg"],
            "prompt": APP_RUN_PROMPTS["2023563076041183233"],
            "notes": "一张毛坯房原图 + 一张成品参考图。",
        },
    }

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourcePolicy": "优先使用 RunningHub 官方页面公开可下载的 cover 图片，再做本地裁切以构造最小验证素材。",
        "downloadedSources": [
            {
                "sourceId": source.source_id,
                "url": source.url,
                "localFilename": source_targets[source.source_id].name,
            }
            for source in SOURCE_SPECS
        ],
        "assets": asset_entries,
        "appRuns": app_runs,
    }


def main() -> int:
    app_meta = load_app_meta()
    TEST_INPUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    source_targets: dict[str, Path] = {}
    for source in SOURCE_SPECS:
        target = RAW_DIR / source.filename
        if not target.exists():
            download_file(source.url, target)
        source_targets[source.source_id] = target

    derived_targets: dict[str, Path] = {}
    for asset in DERIVED_ASSETS:
        source_path = source_targets[asset.source_id]
        target = TEST_INPUT_DIR / asset.local_filename
        crop_image(source_path, target, asset.crop_box)
        derived_targets[asset.asset_id] = target

    manifest = build_manifest(app_meta, source_targets, derived_targets)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"已生成 {len(source_targets)} 个原始素材和 {len(derived_targets)} 个测试输入。")
    print(f"manifest: {MANIFEST_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
