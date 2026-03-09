#!/usr/bin/env python3
"""构建 RunningHub 官方页面清单。

输出 JSON 数组，供本地 references 生成与覆盖矩阵使用。
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from dataclasses import asdict, dataclass
from typing import Iterable, List


LLMS_URL = "https://www.runninghub.cn/runninghub-api-doc-cn/llms.txt"
URL_PREFIX = "https://www.runninghub.cn/runninghub-api-doc-cn/"
LINE_PATTERN = re.compile(
    r"^- (?P<prefix>.*?)\[(?P<title>.*?)\]\((?P<url>https://www\.runninghub\.cn/runninghub-api-doc-cn/[^)]+)\):?(?P<summary>.*)$"
)
PAGE_ID_PATTERN = re.compile(r"/(?P<kind>api|doc|schema)-(?P<page_id>\d+)\.md$")


@dataclass
class InventoryItem:
    index: int
    type: str
    page_id: str
    title: str
    url: str
    category: str
    category_chain: List[str]
    summary: str


def fetch_llms_text(url: str = LLMS_URL) -> str:
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read().decode("utf-8", "replace")


def classify_url(url: str) -> tuple[str, str]:
    match = PAGE_ID_PATTERN.search(url)
    if not match:
        return ("other", "unknown")
    return (match.group("kind"), match.group("page_id"))


def parse_inventory(text: str) -> List[InventoryItem]:
    items: List[InventoryItem] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        match = LINE_PATTERN.match(line)
        if not match:
            continue

        prefix = (match.group("prefix") or "").strip()
        title = match.group("title").strip()
        url = match.group("url").strip()
        summary = (match.group("summary") or "").strip()
        item_type, page_id = classify_url(url)
        category = prefix if prefix else "未分类"
        category_chain = [part.strip() for part in category.split(">") if part.strip()]

        items.append(
            InventoryItem(
                index=len(items) + 1,
                type=item_type,
                page_id=page_id,
                title=title,
                url=url,
                category=category,
                category_chain=category_chain,
                summary=summary,
            )
        )

    return items


def inventory_to_dicts(items: Iterable[InventoryItem]) -> List[dict]:
    return [asdict(item) for item in items]


def main() -> int:
    text = fetch_llms_text()
    items = parse_inventory(text)
    json.dump(inventory_to_dicts(items), sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
