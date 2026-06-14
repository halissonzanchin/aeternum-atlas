from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import json


@dataclass
class HttpResponse:
    status: int
    data: Any
    text: str


class HttpRequestError(RuntimeError):
    def __init__(self, message: str, status: int | None = None, body: str = ""):
        super().__init__(message)
        self.status = status
        self.body = body


def request_json(
    url: str,
    *,
    method: str = "GET",
    headers: Mapping[str, str] | None = None,
    payload: Any = None,
    timeout: int = 30,
) -> HttpResponse:
    body = None
    request_headers = dict(headers or {})

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/json")

    request = Request(url, data=body, headers=request_headers, method=method)

    try:
        with urlopen(request, timeout=timeout) as response:
            raw_text = response.read().decode("utf-8")
            try:
                data = json.loads(raw_text) if raw_text else None
            except json.JSONDecodeError:
                data = None
            return HttpResponse(status=response.status, data=data, text=raw_text)
    except HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        raise HttpRequestError(
            f"HTTP {error.code} while requesting {url}",
            status=error.code,
            body=error_body,
        ) from error
    except URLError as error:
        raise HttpRequestError(f"Network error while requesting {url}: {error}") from error
