import httpx

from .config import settings


def get_product(product_id: int) -> dict | None:
    url = f"{settings.products_service_url}/products/{product_id}"
    try:
        r = httpx.get(url, timeout=5.0)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError:
        return None


def reserve_stock(product_id: int, quantity: int) -> tuple[bool, str]:
    url = f"{settings.products_service_url}/products/{product_id}/reserve"
    try:
        r = httpx.post(url, json={"quantity": quantity}, timeout=5.0)
        if r.status_code == 200:
            return True, "ok"
        if r.status_code == 409:
            return False, "Stock insuficiente"
        if r.status_code == 404:
            return False, "Producto no encontrado"
        return False, f"Error del servicio de productos ({r.status_code})"
    except httpx.HTTPError:
        return False, "Servicio de productos no disponible"
