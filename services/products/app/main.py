from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select

from .config import settings
from .database import init_db, get_session
from .models import Product, ProductCreate, ProductRead, StockUpdate, StockSet
from .cache import cache_get, cache_set, cache_delete

app = FastAPI(title="Users Service", version="1.0.0", root_path=settings.root_path)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "service": "products"}


@app.post("/products", response_model=ProductRead, status_code=201)
def create_product(data: ProductCreate, session: Session = Depends(get_session)):
    product = Product(**data.model_dump())
    session.add(product)
    session.commit()
    session.refresh(product)
    cache_delete("products:all")
    return product


@app.get("/products", response_model=list[ProductRead])
def list_products(session: Session = Depends(get_session)):
    cached = cache_get("products:all")
    if cached is not None:
        return cached["items"]
    products = session.exec(select(Product)).all()
    items = [ProductRead.model_validate(p, from_attributes=True).model_dump() for p in products]
    cache_set("products:all", {"items": items})
    return items


@app.get("/products/{product_id}", response_model=ProductRead)
def get_product(product_id: int, session: Session = Depends(get_session)):
    cached = cache_get(f"product:{product_id}")
    if cached is not None:
        return cached
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    data = ProductRead.model_validate(product, from_attributes=True).model_dump()
    cache_set(f"product:{product_id}", data)
    return data


@app.post("/products/{product_id}/reserve", response_model=ProductRead)
def reserve_stock(product_id: int, data: StockUpdate, session: Session = Depends(get_session)):
    """Descuenta stock. Lo usa el servicio de pedidos al crear una orden."""
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.stock < data.quantity:
        raise HTTPException(status_code=409, detail="Stock insuficiente")
    product.stock -= data.quantity
    session.add(product)
    session.commit()
    session.refresh(product)
    cache_delete(f"product:{product_id}", "products:all")
    return product

@app.patch("/products/{product_id}/stock", response_model=ProductRead)
def update_stock(product_id: int, data: StockSet, session: Session = Depends(get_session)):
    """Fija el stock de un producto a un valor concreto."""
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if data.stock < 0:
        raise HTTPException(status_code=400, detail="El stock no puede ser negativo")
    product.stock = data.stock
    session.add(product)
    session.commit()
    session.refresh(product)
    cache_delete(f"product:{product_id}", "products:all")  # invalida la caché
    return product