from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field
from pydantic import BaseModel


class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int
    quantity: int
    unit_price: float
    total: float
    status: str = "confirmed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(BaseModel):
    product_id: int
    quantity: int


class OrderRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    total: float
    status: str
    created_at: datetime
