import os
os.environ["DATABASE_URL"] = "sqlite:///./test_products.db"
os.environ["REDIS_URL"] = ""

from fastapi.testclient import TestClient
from sqlmodel import SQLModel
from jose import jwt
import pytest

from app.main import app
from app.database import engine
from app.config import settings

IMG = ["https://picsum.photos/seed/test/600"]


@pytest.fixture(autouse=True)
def reset_db():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    yield


client = TestClient(app)


def token_for(email="ana@mail.com"):
    return jwt.encode({"sub": email}, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def test_health():
    assert client.get("/health").json()["service"] == "products"


def test_create_and_get():
    r = client.post("/products", json={"name": "Camiseta", "price": 19.99, "stock": 10, "images": IMG})
    assert r.status_code == 201
    body = r.json()
    assert body["images"] == IMG
    pid = body["id"]

    r = client.get(f"/products/{pid}")
    assert r.status_code == 200
    assert r.json()["name"] == "Camiseta"


def test_create_requires_images():
    r = client.post("/products", json={"name": "Sin foto", "price": 5.0, "stock": 1})
    assert r.status_code == 422  # falta el campo obligatorio images


def test_reserve_stock():
    pid = client.post("/products", json={"name": "Gorra", "price": 9.5, "stock": 3, "images": IMG}).json()["id"]
    r = client.post(f"/products/{pid}/reserve", json={"quantity": 2})
    assert r.status_code == 200
    assert r.json()["stock"] == 1
    r = client.post(f"/products/{pid}/reserve", json={"quantity": 5})
    assert r.status_code == 409


def test_update_stock():
    pid = client.post("/products", json={"name": "Bufanda", "price": 12.0, "stock": 5, "images": IMG}).json()["id"]
    r = client.patch(f"/products/{pid}/stock", json={"stock": 42})
    assert r.status_code == 200
    assert r.json()["stock"] == 42


def test_reviews_require_login():
    pid = client.post("/products", json={"name": "Reloj", "price": 99.0, "stock": 4, "images": IMG}).json()["id"]
    # sin token -> 401
    r = client.post(f"/products/{pid}/reviews", json={"rating": 5, "comment": "genial"})
    assert r.status_code == 401


def test_create_and_list_review():
    pid = client.post("/products", json={"name": "Altavoz", "price": 60.0, "stock": 8, "images": IMG}).json()["id"]
    headers = {"Authorization": f"Bearer {token_for('ana@mail.com')}"}
    r = client.post(f"/products/{pid}/reviews", json={"rating": 4, "comment": "muy bueno"}, headers=headers)
    assert r.status_code == 201
    assert r.json()["user_email"] == "ana@mail.com"
    assert r.json()["rating"] == 4

    r = client.get(f"/products/{pid}/reviews")
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["comment"] == "muy bueno"
