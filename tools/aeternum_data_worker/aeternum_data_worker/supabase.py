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

    def select(self, table: str, params: list[tuple[str, str]]) -> list[dict[str, Any]]:
        data = request_json(
            self._rest_url(table, params),
            headers=self.headers,
        ).data
        return data or []

    def get_institution_ids(self, slug: str | None = None) -> list[str]:
        params = [("select", "id,slug")]
        if slug:
            params.append(("slug", f"eq.{slug}"))
        return [row["id"] for row in self.select("institutions", params) if row.get("id")]

    def get_institution_map(self) -> dict[str, str]:
        rows = self.select("institutions", [("select", "id,slug,name"), ("order", "slug.asc")])
        return {row["slug"]: row["id"] for row in rows if row.get("slug") and row.get("id")}

    def list_models(
        self,
        *,
        model_slug: str | None = None,
        institution_slug: str | None = None,
    ) -> list[dict[str, Any]]:
        params = [
            (
                "select",
                "id,institution_id,title,slug,anatomical_system,anatomical_region,"
                "sketchfab_url,embed_url,difficulty_level,tags,status,thumbnail_url,created_at",
            ),
            ("order", "created_at.desc"),
        ]

        if model_slug:
            params.append(("slug", f"eq.{model_slug}"))

        if institution_slug:
            institution_ids = self.get_institution_ids(institution_slug)
            if not institution_ids:
                return []
            params.append(("institution_id", f"in.({','.join(institution_ids)})"))

        return self.select("models_3d", params)

    def list_annotations(self, model_ids: list[str] | None = None) -> list[dict[str, Any]]:
        params = [
            (
                "select",
                "id,model_id,institution_id,sketchfab_uid,annotation_uid,annotation_index,title,updated_at",
            ),
            ("order", "annotation_index.asc"),
        ]

        if model_ids:
            params.append(("model_id", f"in.({','.join(model_ids)})"))

        return self.select("model_annotations", params)

    def list_users(self) -> list[dict[str, Any]]:
        return self.select(
            "users",
            [("select", "id,email,name,role,status,institution_id,created_at"), ("order", "email.asc")],
        )

    def upsert_annotations(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return self.upsert("model_annotations", rows, "model_id,annotation_index")

    def upsert_models(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return self.upsert("models_3d", rows, "institution_id,slug")

    def upsert(self, table: str, rows: list[dict[str, Any]], conflict: str) -> list[dict[str, Any]]:
        if not rows:
            return []

        headers = {
            **self.headers,
            "Prefer": "resolution=merge-duplicates,return=representation",
        }

        data = request_json(
            self._rest_url(table, [("on_conflict", conflict)]),
            method="POST",
            headers=headers,
            payload=rows,
        ).data

        return data or []
