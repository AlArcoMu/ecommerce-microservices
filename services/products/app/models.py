from typing import Optional

from sqlmodel import SQLModel, Field
from pydantic import BaseModel


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str = ""
    price: float
    stock: int = 0
    image_url: str = ""


class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    stock: int = 0
    image_url: str          # obligatorio: cada producto debe tener imagen


class ProductRead(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock: int
    image_url: str


class StockUpdate(BaseModel):
    quantity: int

class StockSet(BaseModel):
    stock: int