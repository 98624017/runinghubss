#!/usr/bin/env python3
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests


DEFAULT_BASE_URL = "https://www.runninghub.cn"


@dataclass
class RunningHubApiError(Exception):
    """统一封装 RunningHub API 的错误。"""

    message: str
    response: dict[str, Any] | None = None
    http_status: int | None = None

    def __str__(self) -> str:
        detail = self.message
        if self.http_status is not None:
            detail = f"HTTP {self.http_status}: {detail}"
        if self.response:
            code = self.response.get("code")
            msg = self.response.get("msg") or self.response.get("message")
            if code is not None or msg is not None:
                detail = f"{detail} | code={code} msg={msg}"
        return detail


def mask_api_key(api_key: str, visible: int = 4) -> str:
    if len(api_key) <= visible * 2:
        return "*" * len(api_key)
    return f"{api_key[:visible]}{'*' * (len(api_key) - visible * 2)}{api_key[-visible:]}"


class RunningHubClient:
    """RunningHub 底层 HTTP 客户端。"""

    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: int = 60,
        session: requests.Session | None = None,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = session or requests.Session()

    def _headers(
        self,
        *,
        include_auth: bool = True,
        include_json: bool = True,
        extra_headers: dict[str, str] | None = None,
    ) -> dict[str, str]:
        headers = {"Host": "www.runninghub.cn"}
        if include_auth:
            headers["Authorization"] = f"Bearer {self.api_key}"
        if include_json:
            headers["Content-Type"] = "application/json"
        if extra_headers:
            headers.update(extra_headers)
        return headers

    def _request_json(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
        include_auth: bool = True,
        include_json: bool = True,
        extra_headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        response = self.session.request(
            method=method.upper(),
            url=f"{self.base_url}{path}",
            params=params,
            json=json_body,
            headers=self._headers(
                include_auth=include_auth,
                include_json=include_json,
                extra_headers=extra_headers,
            ),
            timeout=self.timeout,
        )
        try:
            payload = response.json()
        except requests.JSONDecodeError as error:
            raise RunningHubApiError(
                message=f"接口未返回 JSON：{response.text[:200]}",
                http_status=response.status_code,
            ) from error

        if response.status_code >= 400:
            raise RunningHubApiError(
                message="HTTP 请求失败",
                response=payload,
                http_status=response.status_code,
            )
        return payload

    def check_account(
        self,
        *,
        include_auth: bool = True,
        include_body: bool = True,
    ) -> dict[str, Any]:
        body = {"apikey": self.api_key} if include_body else {}
        return self._request_json(
            "POST",
            "/uc/openapi/accountStatus",
            json_body=body,
            include_auth=include_auth,
        )

    def get_ai_app_demo(
        self,
        webapp_id: str | int,
        *,
        include_auth: bool = True,
    ) -> dict[str, Any]:
        return self._request_json(
            "GET",
            "/api/webapp/apiCallDemo",
            params={"apiKey": self.api_key, "webappId": str(webapp_id)},
            json_body=None,
            include_auth=include_auth,
            include_json=False,
        )

    def upload_file(self, file_path: str | Path) -> dict[str, Any]:
        target = Path(file_path)
        with target.open("rb") as file_obj:
            response = self.session.post(
                f"{self.base_url}/openapi/v2/media/upload/binary",
                headers=self._headers(include_json=False),
                files={"file": (target.name, file_obj)},
                timeout=self.timeout,
            )
        try:
            payload = response.json()
        except requests.JSONDecodeError as error:
            raise RunningHubApiError(
                message=f"上传接口未返回 JSON：{response.text[:200]}",
                http_status=response.status_code,
            ) from error
        if response.status_code >= 400:
            raise RunningHubApiError(
                message="上传接口 HTTP 失败",
                response=payload,
                http_status=response.status_code,
            )
        return payload

    def run_ai_app(
        self,
        *,
        webapp_id: str | int,
        node_info_list: list[dict[str, Any]],
        webhook_url: str | None = None,
        instance_type: str | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "webappId": str(webapp_id),
            "apiKey": self.api_key,
            "nodeInfoList": node_info_list,
        }
        if webhook_url:
            payload["webhookUrl"] = webhook_url
        if instance_type:
            payload["instanceType"] = instance_type
        return self._request_json("POST", "/task/openapi/ai-app/run", json_body=payload)

    def query_status(
        self,
        task_id: str | int,
        *,
        include_auth: bool = True,
        include_body_api_key: bool = True,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"taskId": str(task_id)}
        if include_body_api_key:
            payload["apiKey"] = self.api_key
        return self._request_json(
            "POST",
            "/task/openapi/status",
            json_body=payload,
            include_auth=include_auth,
        )

    def query_outputs(
        self,
        task_id: str | int,
        *,
        include_auth: bool = True,
        include_body_api_key: bool = True,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"taskId": str(task_id)}
        if include_body_api_key:
            payload["apiKey"] = self.api_key
        return self._request_json(
            "POST",
            "/task/openapi/outputs",
            json_body=payload,
            include_auth=include_auth,
        )

    def query_v2(
        self,
        task_id: str | int,
        *,
        include_auth: bool = True,
    ) -> dict[str, Any]:
        return self._request_json(
            "POST",
            "/openapi/v2/query",
            json_body={"taskId": str(task_id)},
            include_auth=include_auth,
        )

    def save_json(self, path: str | Path, payload: dict[str, Any]) -> None:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
