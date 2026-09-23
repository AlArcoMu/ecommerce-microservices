from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from pydantic import BaseModel


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str = ""
    price: float
    stock: int = 0
    # Varias imágenes (la primera es la portada). Se guarda como JSON.
    images: list[str] = Field(default_factory=list, sa_column=Column(JSON))


class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(index=True)
    user_email: str
    rating: int                 # 1 a 5
    comment: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --------- Esquemas de entrada/salida ---------
class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    stock: int = 0
    images: list[str]           # obligatorio: al menos una imagen


class ProductRead(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    images: list[str]


class StockUpdate(BaseModel):
    quantity: int               # cantidad a descontar (reserva)


class StockSet(BaseModel):
    stock: int                  # fija el stock a este valor


class ReviewCreate(BaseModel):
    rating: int
    comment: str = ""


class ReviewRead(BaseModel):
    id: int
    product_id: int
    user_email: str
    rating: int
    comment: str
    created_at: datetime
