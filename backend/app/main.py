from fastapi import FastAPI

from app.api.routes import router
from app.db.session import engine, metadata

app = FastAPI(title="Auth Service")

app.include_router(router, prefix="/function")


@app.on_event("startup")
def startup():
    # create tables if they don't exist
    metadata.create_all(bind=engine)
