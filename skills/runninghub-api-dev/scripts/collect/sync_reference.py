#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import time
import urllib.request
from collections import defaultdict
from dataclasses import asdict
from pathlib import Path
from typing import Any

import yaml

from build_inventory import InventoryItem, fetch_llms_text, parse_inventory

ROOT = Path(__file__).resolve().parents[2]
REFERENCE_DIR = ROOT / "references"
DOCS_DIR = REFERENCE_DIR / "docs"
ENDPOINTS_DIR = REFERENCE_DIR / "endpoints"
SCHEMAS_DIR = REFERENCE_DIR / "schemas"
MODELS_DIR = REFERENCE_DIR / "models"
ASSETS_DIR = ROOT / "assets"
RAW_DIR = ASSETS_DIR / "official-pages"
INVENTORY_JSON = ASSETS_DIR / "inventory.json"
LLMS_URL = "https://www.runninghub.cn/runninghub-api-doc-cn/llms.txt"

FAMILY_TARGETS = [
    ("标准模型 API > 视频生成 > 海螺AI", "video-hailuo.md", "海螺AI 视频模型"),
    ("标准模型 API > 视频生成 > 全能视频 S", "video-quanneng-s.md", "全能视频 S"),
    ("标准模型 API > 视频生成 > 全能视频 V", "video-quanneng-v.md", "全能视频 V"),
    ("标准模型 API > 视频生成 > 可灵 2.5", "video-keling-25.md", "可灵 2.5"),
    ("标准模型 API > 视频生成 > 可灵 2.6", "video-keling-26.md", "可灵 2.6"),
    ("标准模型 API > 视频生成 > 可灵 o1", "video-keling-o1.md", "可灵 o1"),
    ("标准模型 API > 视频生成 > 万象 2.6", "video-wanxiang-26.md", "万象 2.6"),
    ("标准模型 API > 视频生成 > Vidu", "video-vidu.md", "Vidu"),
    ("标准模型 API > 图片生成 > 全能图片 G", "image-quanneng-g.md", "全能图片 G"),
    ("标准模型 API > 图片生成 > 全能图片", "image-quanneng.md", "全能图片"),
    ("标准模型 API > 图片生成 > seedream", "image-seedream.md", "seedream"),
]

VERIFIED_NOTES = {
    "276613255": [
        "[真实验证] 2026-03-08：Header + body 同传时返回 `code: 0`。",
        "[真实验证] 2026-03-08：仅传 body 中 `apikey` 也能成功返回 `code: 0`。",
        "[真实验证] 2026-03-08：仅传 `Authorization` 且 body 为空时返回 `1601 param apiKey is required`。",
    ],
    "402615348": [
        "[真实验证] 2026-03-08：上传 1×1 PNG 成功，返回 `code: 0`、`data.fileName`、`download_url`、`size`。",
    ],
    "276613252": [
        "[真实验证] 2026-03-08：`taskId=0` 返回 `301 taskId must be positive`。",
        "[真实验证] 2026-03-08：不存在的正整数 `taskId` 返回 `807 APIKEY_TASK_NOT_FOUND`。",
        "[真实验证] 2026-03-08：仅传 `Authorization` 与 `taskId`、不传 body 中 `apiKey` 时返回 `301 must not be blank`。",
    ],
    "276613253": [
        "[真实验证] 2026-03-08：不存在的正整数 `taskId` 返回 `807 APIKEY_TASK_NOT_FOUND`。",
    ],
    "402637109": [
        "[真实验证] 2026-03-08：不存在的正整数 `taskId` 返回结构化对象，`errorCode=1004`，并带中英双语 `errorMessage`。",
        "[真实验证] 2026-03-08：请求体仅包含 `taskId` 即可，未额外要求 body 中 `apiKey`。",
        "[真实验证] 2026-03-08：不传 `Authorization` 时返回 `412 TOKEN_INVALID`。",
    ],
}


def slugify_title(title: str, limit: int = 40) -> str:
    cleaned = re.sub(r"[\\\\/:*?\"<>|]+", "-", title).strip()
    cleaned = re.sub(r"\s+", "-", cleaned)
    cleaned = cleaned.strip("-")
    if not cleaned:
        return "untitled"
    return cleaned[:limit]


def page_target(item: InventoryItem) -> Path:
    filename = f"{item.page_id}-{slugify_title(item.title)}.md"
    if item.type == "api":
        return ENDPOINTS_DIR / filename
    if item.type == "doc":
        return DOCS_DIR / filename
    if item.type == "schema":
        return SCHEMAS_DIR / filename
    return REFERENCE_DIR / filename


def ensure_dirs() -> None:
    for path in [
        REFERENCE_DIR,
        DOCS_DIR,
        ENDPOINTS_DIR,
        SCHEMAS_DIR,
        MODELS_DIR,
        ASSETS_DIR,
        RAW_DIR,
    ]:
        path.mkdir(parents=True, exist_ok=True)


def extract_first_yaml_block(markdown: str) -> str:
    match = re.search(r"```yaml\n(.*?)\n```", markdown, re.S)
    return match.group(1) if match else ""


def fetch_text(url: str) -> str:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                return response.read().decode("utf-8", "replace")
        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt < 2:
                time.sleep(1.5 * (attempt + 1))
    assert last_error is not None
    raise last_error


def safe_yaml_load(yaml_text: str) -> dict[str, Any]:
    if not yaml_text.strip():
        return {}
    try:
        data = yaml.safe_load(yaml_text)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def dump_json_block(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def as_code_block(content: str, language: str = "") -> str:
    return f"```{language}\n{content.rstrip()}\n```"


def extract_first_operation(spec: dict[str, Any]) -> tuple[str | None, str | None, dict[str, Any]]:
    paths = spec.get("paths") or {}
    for path, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, operation in methods.items():
            if not isinstance(operation, dict):
                continue
            return path, method.upper(), operation
    return None, None, {}


def operation_examples(operation: dict[str, Any]) -> tuple[Any, dict[str, Any]]:
    request_body = operation.get("requestBody") or {}
    content = request_body.get("content") or {}
    body_example = None
    for media in content.values():
        if not isinstance(media, dict):
            continue
        if "example" in media:
            body_example = media["example"]
            break
        examples = media.get("examples") or {}
        if examples:
            body_example = next(iter(examples.values()))
            break

    response_examples: dict[str, Any] = {}
    responses = operation.get("responses") or {}
    for status, response in responses.items():
        content_block = (response or {}).get("content") or {}
        for media_type, media in content_block.items():
            if not isinstance(media, dict):
                continue
            if "example" in media:
                response_examples[str(status)] = media["example"]
                break
            examples = media.get("examples") or {}
            if examples:
                first_example = next(iter(examples.values()))
                if isinstance(first_example, dict) and "value" in first_example:
                    response_examples[str(status)] = first_example["value"]
                else:
                    response_examples[str(status)] = first_example
                break
    return body_example, response_examples


def render_api_page(item: InventoryItem, markdown: str, spec: dict[str, Any], target: Path) -> str:
    path, method, operation = extract_first_operation(spec)
    body_example, response_examples = operation_examples(operation)
    headers = [
        parameter
        for parameter in operation.get("parameters", [])
        if isinstance(parameter, dict) and parameter.get("in") == "header"
    ]
    tags = operation.get("tags") or []
    related = []
    if item.category:
        related.append(f"- 分类：`{item.category}`")
    if tags:
        related.append(f"- Tags：`{', '.join(str(tag) for tag in tags)}`")

    lines = [
        f"# {item.title}",
        "",
        "- [官网明确] 页面类型：API",
        f"- [官网明确] 官方地址：`{item.url}`",
        f"- [官网明确] 页面编号：`{item.page_id}`",
        f"- [官网明确] 本地文件：`{target.relative_to(ROOT)}`",
    ]
    if item.summary:
        lines.append(f"- [官网明确] 索引摘要：{item.summary}")
    if related:
        lines.extend(related)

    lines.extend(
        [
            "",
            "## 接口摘要",
            "",
            f"- [官网明确] 方法：`{method or '未知'}`",
            f"- [官网明确] 路径：`{path or '未知'}`",
            f"- [交叉整理] 推荐调用顺序：先确认鉴权，再准备上传资源，最后创建或查询任务。",
            "",
            "## Header 参数",
            "",
        ]
    )

    if headers:
        for header in headers:
            lines.append(
                f"- [官网明确] `{header.get('name', '')}`："
                f"{header.get('description') or '无描述'}"
            )
    else:
        lines.append("- [官网明确] 未在页面中解析到 header 参数。")

    lines.extend(["", "## 请求示例", ""])
    if body_example is not None:
        lines.append(as_code_block(dump_json_block(body_example), "json"))
    else:
        lines.append("- [官网明确] 页面未提供可解析的请求示例。")

    lines.extend(["", "## 响应示例", ""])
    if response_examples:
        for status, example in response_examples.items():
            lines.append(f"### HTTP {status}")
            lines.append("")
            lines.append(as_code_block(dump_json_block(example), "json"))
            lines.append("")
    else:
        lines.append("- [官网明确] 页面未提供可解析的响应示例。")

    lines.extend(
        [
            "## 开发提示",
            "",
            "- [交叉整理] 若接口同时要求 `Authorization` 和 body 内 `apiKey/apikey`，默认两处都传。",
            "- [推断建议] 对生成型接口，优先配合状态查询与结果查询一起实现，不要只写创建请求。",
            "",
        ]
    )
    if item.page_id in VERIFIED_NOTES:
        lines.extend(["## 真实验证补充", ""])
        for note in VERIFIED_NOTES[item.page_id]:
            lines.append(f"- {note}")
        lines.append("")
    lines.extend(
        [
            "## 原始 OpenAPI 归档",
            "",
            as_code_block(extract_first_yaml_block(markdown) or markdown, "yaml"),
        ]
    )
    return "\n".join(lines).rstrip() + "\n"


def render_schema_page(item: InventoryItem, markdown: str, spec: dict[str, Any], target: Path) -> str:
    schemas = ((spec.get("components") or {}).get("schemas") or {})
    schema_name = next(iter(schemas.keys()), item.title)
    schema_body = schemas.get(schema_name) or {}
    properties = schema_body.get("properties") or {}

    lines = [
        f"# {item.title}",
        "",
        "- [官网明确] 页面类型：Schema",
        f"- [官网明确] 官方地址：`{item.url}`",
        f"- [官网明确] 页面编号：`{item.page_id}`",
        f"- [官网明确] Schema 名称：`{schema_name}`",
        "",
        "## 字段摘要",
        "",
    ]

    if properties:
        for name, value in properties.items():
            if not isinstance(value, dict):
                continue
            field_type = value.get("type", "unknown")
            description = value.get("description") or ""
            lines.append(f"- [官网明确] `{name}`：`{field_type}` {description}".rstrip())
    else:
        lines.append("- [官网明确] 页面未解析到字段定义。")

    lines.extend(
        [
            "",
            "## 原始 Schema 归档",
            "",
            as_code_block(extract_first_yaml_block(markdown) or markdown, "yaml"),
        ]
    )
    return "\n".join(lines).rstrip() + "\n"


def render_doc_page(item: InventoryItem, markdown: str, target: Path) -> str:
    stripped = markdown.strip()
    lines = [
        f"# {item.title}",
        "",
        "- [官网明确] 页面类型：文档",
        f"- [官网明确] 官方地址：`{item.url}`",
        f"- [官网明确] 页面编号：`{item.page_id}`",
    ]
    if item.summary:
        lines.append(f"- [官网明确] 索引摘要：{item.summary}")
    if item.category:
        lines.append(f"- [官网明确] 分类：`{item.category}`")
    lines.extend(
        [
            "",
            "## 本地说明",
            "",
            "- [交叉整理] 该页为官网说明文档的本地归档，可作为离线查阅入口。",
            "",
            "## 官网原文归档",
            "",
            stripped,
            "",
        ]
    )
    return "\n".join(lines).rstrip() + "\n"


def family_target_for(item: InventoryItem) -> Path | None:
    if item.type != "api":
        return None
    for prefix, filename, _display_name in FAMILY_TARGETS:
        if item.category.startswith(prefix):
            return MODELS_DIR / filename
    return None


def render_family_pages(items: list[InventoryItem], targets: dict[str, str]) -> dict[Path, str]:
    grouped: dict[str, list[InventoryItem]] = defaultdict(list)
    display_names: dict[str, str] = {}
    for prefix, filename, display_name in FAMILY_TARGETS:
        display_names[filename] = display_name
    for item in items:
        target = family_target_for(item)
        if target is not None:
            grouped[target.name].append(item)

    rendered: dict[Path, str] = {}
    for _prefix, filename, display_name in FAMILY_TARGETS:
        group = grouped.get(filename, [])
        lines = [
            f"# {display_name}",
            "",
            f"- [交叉整理] 本页汇总同一模型族的官网接口，便于替代官网逐页检索。",
            f"- [交叉整理] 接口数量：`{len(group)}`",
            "",
            "## 收录接口",
            "",
        ]
        if group:
            for item in group:
                target_path = targets.get(item.page_id, "")
                lines.append(
                    f"- [官网明确] `{item.title}` → `{target_path}`"
                )
                if item.summary:
                    lines.append(f"  - 摘要：{item.summary}")
        else:
            lines.append("- [官网明确] 当前索引中未发现该模型族接口。")

        lines.extend(
            [
                "",
                "## 开发建议",
                "",
                "- [交叉整理] 同一模型族的接口通常共享鉴权、异步任务查询和结果获取逻辑。",
                "- [推断建议] 新接入时优先选择描述更完整、示例更清晰的端点做第一条链路验证。",
                "",
                "## 验证状态",
                "",
                "- [推断建议] 本模型族默认先做文档归档；只有高价值接口才进入真实验证。",
            ]
        )
        rendered[MODELS_DIR / filename] = "\n".join(lines).rstrip() + "\n"
    return rendered


def render_index(items: list[InventoryItem], targets: dict[str, str]) -> str:
    type_groups: dict[str, list[InventoryItem]] = defaultdict(list)
    for item in items:
        type_groups[item.type].append(item)

    lines = [
        "# RunningHub 官网页面总索引",
        "",
        "- [交叉整理] 本页按 `llms.txt` 全量生成，用于确认官网页面在本地知识库中的归宿。",
        f"- [官网明确] 页面总数：`{len(items)}`",
        f"- [官网明确] API 页：`{len(type_groups.get('api', []))}`",
        f"- [官网明确] 文档页：`{len(type_groups.get('doc', []))}`",
        f"- [官网明确] Schema 页：`{len(type_groups.get('schema', []))}`",
        "",
    ]

    for page_type, label in [("doc", "文档页"), ("api", "API 页"), ("schema", "Schema 页")]:
        group = type_groups.get(page_type, [])
        lines.extend([f"## {label}", ""])
        for item in group:
            lines.append(
                f"- [官网明确] `{item.title}` → `{targets[item.page_id]}`"
            )
            lines.append(f"  - 官方地址：`{item.url}`")
            if item.category:
                lines.append(f"  - 分类：`{item.category}`")
            if item.summary:
                lines.append(f"  - 摘要：{item.summary}")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def render_matrix(items: list[InventoryItem], targets: dict[str, str]) -> str:
    header = [
        "# RunningHub 页面覆盖矩阵",
        "",
        "| 页面标题 | 类型 | 官方地址 | 本地文件 | 覆盖状态 | 验证状态 | 备注 |",
        "|---|---|---|---|---|---|---|",
    ]
    rows = []
    for item in items:
        covered = "已覆盖"
        verified = "待验证"
        if item.page_id in VERIFIED_NOTES:
            verified = "已验证"
        note_parts = []
        if item.category:
            note_parts.append(item.category)
        if item.summary:
            note_parts.append(item.summary)
        note = "；".join(note_parts)
        rows.append(
            "| {title} | {page_type} | `{url}` | `{target}` | {covered} | {verified} | {note} |".format(
                title=item.title.replace("|", "\\|"),
                page_type=item.type,
                url=item.url,
                target=targets[item.page_id],
                covered=covered,
                verified=verified,
                note=note.replace("|", "\\|"),
            )
        )
    return "\n".join(header + rows + [""]) 


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> int:
    ensure_dirs()

    if INVENTORY_JSON.exists():
        items = [
            InventoryItem(**row)
            for row in json.loads(INVENTORY_JSON.read_text(encoding="utf-8"))
        ]
    else:
        llms_text = fetch_llms_text(LLMS_URL)
        items = parse_inventory(llms_text)
        INVENTORY_JSON.write_text(
            json.dumps([asdict(item) for item in items], ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    targets: dict[str, str] = {}

    for item in items:
        target = page_target(item)
        targets[item.page_id] = str(target.relative_to(ROOT))
        markdown = fetch_text(item.url)
        write_file(RAW_DIR / f"{item.page_id}.md", markdown)
        yaml_block = extract_first_yaml_block(markdown)
        spec = safe_yaml_load(yaml_block)

        if item.type == "api":
            content = render_api_page(item, markdown, spec, target)
        elif item.type == "schema":
            content = render_schema_page(item, markdown, spec, target)
        else:
            content = render_doc_page(item, markdown, target)
        write_file(target, content)

    family_pages = render_family_pages(items, targets)
    for target, content in family_pages.items():
        write_file(target, content)

    write_file(REFERENCE_DIR / "10-api-index.md", render_index(items, targets))
    write_file(REFERENCE_DIR / "11-api-matrix.md", render_matrix(items, targets))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
