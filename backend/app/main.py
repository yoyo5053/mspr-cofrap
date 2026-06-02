import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.db.session import engine, metadata

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("cofrap")

app = FastAPI(title="Auth Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    client = request.client.host if request.client else "unknown"
    logger.info("Incoming request: %s %s from %s", request.method, request.url.path, client)
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Request failed: %s %s", request.method, request.url.path)
        raise
    duration = (time.time() - start_time) * 1000
    logger.info(
        "Completed request: %s %s status=%s duration=%.1fms",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response

app.include_router(router, prefix="/function")


@app.on_event("startup")
def startup():
    metadata.create_all(bind=engine)
    logger.info("Startup complete: database metadata created.")
