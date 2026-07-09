import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from core.security import get_current_user
from core.rate_limiter import limiter
from fastapi import Request
from database.repositories import alert_repo

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertConfigCreate(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10)
    alert_type: str = Field(..., pattern="^(PRICE_BELOW|PRICE_ABOVE|SENTIMENT)$")
    threshold_value: Optional[float] = None
    sentiment_keywords: Optional[str] = None
    cooldown_hours: int = Field(default=4, ge=1, le=168)


@router.post("", status_code=201)
@limiter.limit("10/minute")
def create_alert(request: Request, body: AlertConfigCreate, current_user: dict = Depends(get_current_user)):
    """Cria um novo alerta de monitoramento para o usuário autenticado."""
    ticker = body.ticker.upper().strip()
    if body.alert_type in ("PRICE_BELOW", "PRICE_ABOVE") and body.threshold_value is None:
        raise HTTPException(status_code=400, detail="threshold_value e obrigatorio para alertas de preco.")
    try:
        config = alert_repo.create_config(
            user_id=current_user["id"],
            ticker=ticker,
            alert_type=body.alert_type,
            threshold_value=body.threshold_value,
            sentiment_keywords=body.sentiment_keywords,
            cooldown_hours=body.cooldown_hours,
        )
        return config
    except Exception as e:
        if "UNIQUE constraint" in str(e):
            raise HTTPException(status_code=409, detail="Alerta identico ja existe para este ativo.")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def list_alerts(current_user: dict = Depends(get_current_user)):
    """Lista todos os alertas configurados pelo usuário autenticado."""
    return alert_repo.get_by_user(current_user["id"])


@router.delete("/{alert_id}")
def delete_alert(alert_id: int, current_user: dict = Depends(get_current_user)):
    """Desativa (soft delete) um alerta do usuário autenticado."""
    success = alert_repo.deactivate_config(alert_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Alerta nao encontrado ou sem permissao.")
    return {"message": "Alerta desativado com sucesso."}


@router.get("/history")
def get_alert_history(current_user: dict = Depends(get_current_user)):
    """Retorna o histórico de alertas disparados e analisados pelo Gemini."""
    dispatches = alert_repo.get_history_by_user(current_user["id"])
    result = []
    for d in dispatches:
        item = dict(d)
        if item.get("analysis_payload"):
            try:
                item["analysis_payload"] = json.loads(item["analysis_payload"])
            except Exception:
                pass
        result.append(item)
    return result
