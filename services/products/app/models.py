from typing import Optional

from sqlmodel import SQLModel, Field
from pydantic import BaseModel


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str = ""
    price: float
    stock: int = 0


class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    stock: int = 0


class ProductRead(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int


class StockUpdate(BaseModel):
    quantity: int  # cantidad a descontar (positiva)
