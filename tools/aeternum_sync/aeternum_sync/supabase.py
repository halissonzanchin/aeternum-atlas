from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

from .http import request_json


class SupabaseRestClient:
    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.key = key

    @property
    def headers(self) -> dict[str, str]:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }

    def _rest_url(self, table: str, params: list[tuple[str, str]] | None = None) -> str:
        query = urlencode(params or [])
        return f"{self.url}/rest/v1/{table}" + (f"?{query}" if query else "")

    def get_institution_ids(self, slug: str | None = None) -> list[str]:
        params = [("select", "id,slug")]
        if slug:
            params.append(("slug", f"eq.{slug}"))

        data = request_json(
            self._rest_url("institutions", params),
            headers=self.headers,
        ).data

        return [row["id"] for row in data or [] if row.get("id")]

    def list_models(
        self,
        *,
        model_slug: str | None = None,
        institution_slug: str | None = None,
    ) -> list[dict[str, Any]]:
        params = [
            ("select", "id,institution_id,title,slug,sketchfab_url,embed_url,status,created_at"),
            ("order", "created_at.desc"),
        ]

        if model_slug:
            params.append(("slug", f"eq.{model_slug}"))

        if institution_slug:
            institution_ids = self.get_institution_ids(institution_slug)
            if not institution_ids:
                return []
            params.append(("institution_id", f"in.({','.join(institution_ids)})"))

        data = request_json(
            self._rest_url("models_3d", params),
            headers=self.headers,
        ).data

        return data or []

    def upsert_annotations(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not rows:
            return []

        headers = {
            **self.headers,
            "Prefer": "resolution=merge-duplicates,return=representation",
        }

        data = request_json(
            self._rest_url("model_annotations", [("on_conflict", "model_id,annotation_index")]),
            method="POST",
            headers=headers,
            payload=rows,
        ).data

        return data or []
