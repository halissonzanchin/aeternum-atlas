from pathlib import Path
from typing import Dict
import os


def load_env_file(path: str | None) -> Dict[str, str]:
    if not path:
        return {}

    env_path = Path(path)
    if not env_path.exists():
        raise FileNotFoundError(f"Env file not found: {env_path}")

    loaded: Dict[str, str] = {}
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value
        loaded[key] = value

    return loaded


def get_env(name: str, *fallback_names: str, required: bool = False) -> str:
    for key in (name, *fallback_names):
        value = os.environ.get(key)
        if value:
            return value.strip()

    if required:
        aliases = ", ".join((name, *fallback_names))
        raise RuntimeError(f"Missing required environment variable: {aliases}")

    return ""
