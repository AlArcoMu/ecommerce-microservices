from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select

from .config import settings
from .database import init_db, get_session
from .models import Order, OrderCreate, OrderRead
from . import products_client

app = FastAPI(title="Orders Service", version="1.0.0", root_path=settings.root_path)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "service": "orders"}


@app.post("/orders", response_model=OrderRead, status_code=201)
def create_order(data: OrderCreate, session: Session = Depends(get_session)):
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser positiva")

    # 1. Consultar el producto en el servicio de productos
    product = products_client.get_product(data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # 2. Reservar stock (llamada síncrona entre microservicios)
    ok, msg = products_client.reserve_stock(data.product_id, data.quantity)
    if not ok:
        raise HTTPException(status_code=409, detail=msg)

    # 3. Crear el pedido
    unit_price = product["price"]
    order = Order(
        product_id=data.product_id,
        quantity=data.quantity,
        unit_price=unit_price,
        total=round(unit_price * data.quantity, 2),
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return order


@app.get("/orders", response_model=list[OrderRead])
def list_orders(session: Session = Depends(get_session)):
    return session.exec(select(Order)).all()


@app.get("/orders/{order_id}", response_model=OrderRead)
def get_order(order_id: int, session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order
