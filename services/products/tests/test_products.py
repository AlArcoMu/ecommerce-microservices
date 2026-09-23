import os
os.environ["DATABASE_URL"] = "sqlite:///./test_products.db"
os.environ["REDIS_URL"] = ""

from fastapi.testclient import TestClient
from sqlmodel import SQLModel
import pytest

from app.main import app
from app.database import engine


@pytest.fixture(autouse=True)
def reset_db():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    yield


client = TestClient(app)


def test_health():
    assert client.get("/health").json()["service"] == "products"


def test_create_and_get():
    r = client.post("/products", json={"name": "Camiseta", "price": 19.99, "stock": 10,
                                       "image_url": "https://picsum.photos/seed/camiseta/600"})
    assert r.status_code == 201
    pid = r.json()["id"]

    r = client.get(f"/products/{pid}")
    assert r.status_code == 200
    assert r.json()["name"] == "Camiseta"


def test_reserve_stock():
    pid = client.post("/products", json={"name": "Gorra", "price": 9.5, "stock": 3,
                                         "image_url": "https://picsum.photos/seed/gorra/600"}).json()["id"]
    r = client.post(f"/products/{pid}/reserve", json={"quantity": 2})
    assert r.status_code == 200
    assert r.json()["stock"] == 1

    # stock insuficiente
    r = client.post(f"/products/{pid}/reserve", json={"quantity": 5})
    assert r.status_code == 409

def test_update_stock():
    pid = client.post("/products", json={"name": "Bufanda", "price": 12.0, "stock": 5,
                                         "image_url": "https://picsum.photos/seed/bufanda/600"}).json()["id"]
    r = client.patch(f"/products/{pid}/stock", json={"stock": 42})
    assert r.status_code == 200
    assert r.json()["stock"] == 42