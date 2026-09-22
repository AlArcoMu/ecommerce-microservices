import os
os.environ["DATABASE_URL"] = "sqlite:///./test_orders.db"

from fastapi.testclient import TestClient
from sqlmodel import SQLModel
import pytest

from app.main import app
from app.database import engine
from app import products_client


@pytest.fixture(autouse=True)
def reset_db():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    yield


client = TestClient(app)


def test_health():
    assert client.get("/health").json()["service"] == "orders"


def test_create_order_ok(monkeypatch):
    # Simulamos (mock) el servicio de productos: no hay red en los tests
    monkeypatch.setattr(products_client, "get_product", lambda pid: {"id": pid, "price": 10.0, "stock": 5})
    monkeypatch.setattr(products_client, "reserve_stock", lambda pid, qty: (True, "ok"))

    r = client.post("/orders", json={"product_id": 1, "quantity": 2})
    assert r.status_code == 201
    body = r.json()
    assert body["total"] == 20.0
    assert body["status"] == "confirmed"


def test_create_order_no_stock(monkeypatch):
    monkeypatch.setattr(products_client, "get_product", lambda pid: {"id": pid, "price": 10.0, "stock": 1})
    monkeypatch.setattr(products_client, "reserve_stock", lambda pid, qty: (False, "Stock insuficiente"))

    r = client.post("/orders", json={"product_id": 1, "quantity": 99})
    assert r.status_code == 409


def test_create_order_product_missing(monkeypatch):
    monkeypatch.setattr(products_client, "get_product", lambda pid: None)
    r = client.post("/orders", json={"product_id": 999, "quantity": 1})
    assert r.status_code == 404
