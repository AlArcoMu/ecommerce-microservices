import json
from typing import Optional

from .config import settings

try:
    import redis
    _client = redis.from_url(settings.redis_url, decode_responses=True) if settings.redis_url else None
except Exception:
    _client = None


def cache_get(key: str) -> Optional[dict]:
    if not _client:
        return None
    try:
        raw = _client.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None


def cache_set(key: str, value: dict) -> None:
    if not _client:
        return
    try:
        _client.setex(key, settings.cache_ttl, json.dumps(value, default=str))
    except Exception:
        pass


def cache_delete(*keys: str) -> None:
    if not _client:
        return
    try:
        _client.delete(*keys)
    except Exception:
        pass
