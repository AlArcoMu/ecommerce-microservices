import os
os.environ["DATABASE_URL"] = "sqlite:///./test_users.db"

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
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["service"] == "users"


def test_register_and_login():
    r = client.post("/register", json={"email": "a@b.com", "password": "secret123"})
    assert r.status_code == 201
    assert r.json()["email"] == "a@b.com"

    r = client.post("/login", data={"username": "a@b.com", "password": "secret123"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    assert token

    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "a@b.com"


def test_login_wrong_password():
    client.post("/register", json={"email": "x@y.com", "password": "good-pass"})
    r = client.post("/login", data={"username": "x@y.com", "password": "bad-pass"})
    assert r.status_code == 401
