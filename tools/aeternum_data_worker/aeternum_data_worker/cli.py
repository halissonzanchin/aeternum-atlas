from __future__ import annotations

from argparse import ArgumentParser, Namespace, SUPPRESS
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import json
import sys

from .catalog import audit_tenancy, status_is_active, validate_catalog
from .env import get_env, load_env_file
from .importer import MODEL_COLUMNS, load_model_file, normalize_import_rows
from .sketchfab import annotations_to_rows, extract_model_uid, fetch_annotations
from .supabase import SupabaseRestClient


def _print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


def _write_report(data: Any, output_path: str | None) -> None:
    if not output_path:
        return

    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nRelatório salvo em: {path}")


def _default_report_path(name: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return str(Path("reports") / "aeternum-data-worker" / f"{stamp}-{name}.json")


def _build_client(args: Namespace, *, write: bool = False) -> SupabaseRestClient:
    load_env_file(args.env)
    supabase_url = get_env("SUPABASE_URL", "VITE_SUPABASE_URL", required=True)

    if write:
        supabase_key = get_env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", required=True)
    else:
        supabase_key = get_env(
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_SECRET_KEY",
            "SUPABASE_ANON_KEY",
            "VITE_SUPABASE_ANON_KEY",
            required=True,
        )

    return SupabaseRestClient(supabase_url, supabase_key)


def fetch_annotations_command(args: Namespace) -> int:
    model_uid = args.sketchfab_uid or extract_model_uid(args.sketchfab_url or "")
    if not model_uid:
        raise RuntimeError("Informe --sketchfab-url ou --sketchfab-uid.")

    annotations = fetch_annotations(model_uid, timeout=args.timeout)
    payload = {
        "sketchfab_uid": model_uid,
        "annotation_count": len(annotations),
        "annotations": [asdict(annotation) for annotation in annotations],
    }
    _print_json(payload)
    return 0


def sync_annotations_command(args: Namespace) -> int:
    client = _build_client(args, write=args.apply)
    models = client.list_models(model_slug=args.model_slug, institution_slug=args.institution_slug)
    report: list[dict[str, Any]] = []

    for model in models:
        if args.active_only and not status_is_active(model.get("status")):
            continue

        sketchfab_uid = extract_model_uid(model.get("embed_url") or "", model.get("sketchfab_url") or "")
        model_report: dict[str, Any] = {
            "model_id": model.get("id"),
            "institution_id": model.get("institution_id"),
            "slug": model.get("slug"),
            "title": model.get("title"),
            "status": model.get("status"),
            "sketchfab_uid": sketchfab_uid,
            "annotation_count": 0,
            "synced": False,
            "error": "",
        }

        if not sketchfab_uid:
            model_report["error"] = "missing_sketchfab_uid"
            report.append(model_report)
            continue

        try:
            annotations = fetch_annotations(sketchfab_uid, timeout=args.timeout)
            rows = annotations_to_rows(
                annotations,
                model_id=model["id"],
                institution_id=model["institution_id"],
                sketchfab_uid=sketchfab_uid,
            )
            model_report["annotation_count"] = len(rows)
            model_report["annotations"] = [row["title"] for row in rows]

            if args.apply:
                upserted = client.upsert_annotations(rows)
                model_report["synced"] = True
                model_report["upserted_count"] = len(upserted)
            else:
                model_report["dry_run"] = True

        except Exception as error:  # noqa: BLE001 - worker should continue scanning models.
            model_report["error"] = str(error)

        report.append(model_report)

    payload = {
        "command": "sync-annotations",
        "mode": "apply" if args.apply else "dry-run",
        "model_count": len(report),
        "report": report,
    }
    _print_json(payload)
    _write_report(payload, args.out)
    return 0


def validate_catalog_command(args: Namespace) -> int:
    client = _build_client(args)
    payload = {
        "command": "validate-catalog",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "report": validate_catalog(
            client,
            model_slug=args.model_slug,
            institution_slug=args.institution_slug,
            check_sketchfab=args.check_sketchfab,
            timeout=args.timeout,
        ),
    }
    _print_json(payload)
    _write_report(payload, args.out or (_default_report_path("catalog-validation") if args.save_report else None))
    return 1 if args.fail_on_issues and payload["report"]["models_with_issues"] else 0


def audit_tenancy_command(args: Namespace) -> int:
    client = _build_client(args)
    payload = {
        "command": "audit-tenancy",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "report": audit_tenancy(
            client,
            model_slug=args.model_slug,
            institution_slug=args.institution_slug,
        ),
    }
    _print_json(payload)
    _write_report(payload, args.out or (_default_report_path("tenancy-audit") if args.save_report else None))
    return 1 if args.fail_on_issues and payload["report"]["issue_count"] else 0


def import_models_command(args: Namespace) -> int:
    rows = load_model_file(args.input)
    client = _build_client(args, write=args.apply)
    normalized, errors = normalize_import_rows(client, rows)

    payload: dict[str, Any] = {
        "command": "import-models",
        "mode": "apply" if args.apply else "dry-run",
        "input": args.input,
        "input_count": len(rows),
        "valid_count": len(normalized),
        "error_count": len(errors),
        "errors": errors,
        "models": normalized,
    }

    if args.apply and not errors:
        upserted = client.upsert_models(normalized)
        payload["upserted_count"] = len(upserted)
    elif args.apply and errors:
        payload["apply_blocked"] = "Corrija os erros antes de gravar."

    _print_json(payload)
    _write_report(payload, args.out)
    return 1 if errors else 0


def doctor_command(args: Namespace) -> int:
    client = _build_client(args)
    validation = validate_catalog(
        client,
        model_slug=args.model_slug,
        institution_slug=args.institution_slug,
        check_sketchfab=args.check_sketchfab,
        timeout=args.timeout,
    )
    audit = audit_tenancy(
        client,
        model_slug=args.model_slug,
        institution_slug=args.institution_slug,
    )
    payload = {
        "command": "doctor",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "validation": validation,
        "audit": audit,
    }
    _print_json(payload)
    _write_report(payload, args.out or (_default_report_path("doctor") if args.save_report else None))
    has_issues = validation["models_with_issues"] or audit["issue_count"]
    return 1 if args.fail_on_issues and has_issues else 0


def build_parser() -> ArgumentParser:
    parser = ArgumentParser(
        prog="aeternum-data-worker",
        description="Aeternum Atlas Python data worker for 3D model catalog automation.",
    )
    parser.add_argument("--env", default=".env", help="Env file path. Defaults to .env.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    def add_env_argument(command_parser: ArgumentParser) -> None:
        command_parser.add_argument("--env", default=SUPPRESS, help="Env file path. Defaults to .env.")

    fetch_parser = subparsers.add_parser("fetch-annotations", help="Fetch annotations from one Sketchfab model.")
    add_env_argument(fetch_parser)
    fetch_parser.add_argument("--sketchfab-url", default="", help="Sketchfab model or embed URL.")
    fetch_parser.add_argument("--sketchfab-uid", default="", help="Sketchfab 32-character model UID.")
    fetch_parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds.")
    fetch_parser.set_defaults(func=fetch_annotations_command)

    sync_parser = subparsers.add_parser("sync-annotations", help="Sync Sketchfab annotations into Supabase.")
    add_env_argument(sync_parser)
    sync_parser.add_argument("--apply", action="store_true", help="Write annotations to Supabase.")
    sync_parser.add_argument("--model-slug", default="", help="Limit sync to one models_3d.slug.")
    sync_parser.add_argument("--institution-slug", default="", help="Limit sync to one institutions.slug.")
    sync_parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds.")
    sync_parser.add_argument("--include-inactive", action="store_false", dest="active_only", help="Include inactive models.")
    sync_parser.add_argument("--out", default="", help="Optional JSON report output path.")
    sync_parser.set_defaults(func=sync_annotations_command)

    validate_parser = subparsers.add_parser("validate-catalog", help="Validate required metadata and annotations.")
    add_env_argument(validate_parser)
    validate_parser.add_argument("--model-slug", default="", help="Limit validation to one models_3d.slug.")
    validate_parser.add_argument("--institution-slug", default="", help="Limit validation to one institutions.slug.")
    validate_parser.add_argument("--check-sketchfab", action="store_true", help="Compare cached annotations with live Sketchfab annotations.")
    validate_parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds.")
    validate_parser.add_argument("--save-report", action="store_true", help="Save report under reports/aeternum-data-worker.")
    validate_parser.add_argument("--out", default="", help="Optional JSON report output path.")
    validate_parser.add_argument("--fail-on-issues", action="store_true", help="Exit with code 1 when issues are found.")
    validate_parser.set_defaults(func=validate_catalog_command)

    audit_parser = subparsers.add_parser("audit-tenancy", help="Audit tenant consistency across models, annotations and users.")
    add_env_argument(audit_parser)
    audit_parser.add_argument("--model-slug", default="", help="Limit audit to one models_3d.slug.")
    audit_parser.add_argument("--institution-slug", default="", help="Limit audit to one institutions.slug.")
    audit_parser.add_argument("--save-report", action="store_true", help="Save report under reports/aeternum-data-worker.")
    audit_parser.add_argument("--out", default="", help="Optional JSON report output path.")
    audit_parser.add_argument("--fail-on-issues", action="store_true", help="Exit with code 1 when issues are found.")
    audit_parser.set_defaults(func=audit_tenancy_command)

    import_parser = subparsers.add_parser("import-models", help="Dry-run or import models from CSV/JSON.")
    add_env_argument(import_parser)
    import_parser.add_argument("--input", required=True, help="CSV or JSON file with model rows.")
    import_parser.add_argument("--apply", action="store_true", help="Write valid models to Supabase.")
    import_parser.add_argument("--out", default="", help="Optional JSON report output path.")
    import_parser.set_defaults(func=import_models_command)

    doctor_parser = subparsers.add_parser("doctor", help="Run catalog validation and tenant audit together.")
    add_env_argument(doctor_parser)
    doctor_parser.add_argument("--model-slug", default="", help="Limit checks to one models_3d.slug.")
    doctor_parser.add_argument("--institution-slug", default="", help="Limit checks to one institutions.slug.")
    doctor_parser.add_argument("--check-sketchfab", action="store_true", help="Compare cached annotations with live Sketchfab annotations.")
    doctor_parser.add_argument("--timeout", type=int, default=30, help="HTTP timeout in seconds.")
    doctor_parser.add_argument("--save-report", action="store_true", help="Save report under reports/aeternum-data-worker.")
    doctor_parser.add_argument("--out", default="", help="Optional JSON report output path.")
    doctor_parser.add_argument("--fail-on-issues", action="store_true", help="Exit with code 1 when issues are found.")
    doctor_parser.set_defaults(func=doctor_command)

    template_parser = subparsers.add_parser("model-template", help="Print the CSV header for model import.")
    add_env_argument(template_parser)
    template_parser.set_defaults(func=lambda _args: print(",".join(MODEL_COLUMNS)) or 0)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    for attr in ("model_slug", "institution_slug", "out"):
        if hasattr(args, attr):
            setattr(args, attr, getattr(args, attr) or None)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
