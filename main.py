from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from core.frontend import mount_frontend
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from apscheduler.schedulers.background import BackgroundScheduler
import logging
import os
from core.config import settings
from core.rate_limiter import limiter
from database.connection import init_db
from routers import auth, users, market, alerts

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Radar B3 API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
def startup_event():
    init_db()
    logger.info("Banco de dados inicializado e App iniciado.")

    # Inicia o scheduler de background jobs para monitoramento de alertas
    from services.alert_service import orchestrator
    scheduler = BackgroundScheduler(timezone="America/Sao_Paulo")
    scheduler.add_job(orchestrator.run_price_check, "interval", seconds=60, id="price_check")
    scheduler.add_job(orchestrator.run_alert_processor, "interval", seconds=30, id="alert_processor")
    scheduler.start()
    logger.info("Scheduler de alertas iniciado: price_check (60s), alert_processor (30s).")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(market.router)
app.include_router(alerts.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "gemini_configured": bool(settings.gemini_api_key)}

# Serve React App
frontend_path = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if not mount_frontend(app, frontend_path):
    logger.warning(f"Frontend dist folder not found at {frontend_path}. Please run npm run build in frontend folder.")
