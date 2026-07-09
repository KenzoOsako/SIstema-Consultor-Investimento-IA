from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict
from core.security import get_current_user
from services.market_service import get_ticker_info, get_price_history
from services.ai_service import get_chat_response

router = APIRouter(prefix="/api", tags=["market"])

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

@router.get("/ticker/{ticker}")
def get_ticker(ticker: str):
    try:
        data = get_ticker_info(ticker)
        if "dividends_history" in data and not data["dividends_history"].empty:
            df = data["dividends_history"].copy()
            df["Date"] = df["Date"].astype(str)
            data["dividends_history"] = df.to_dict(orient="records")
        else:
            data["dividends_history"] = []
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/ticker/{ticker}/history")
def get_ticker_history(ticker: str, period: str = "1y"):
    try:
        df = get_price_history(ticker, period)
        if df.empty:
            return {"history": []}
        df_copy = df.copy()
        df_copy["Date"] = df_copy["Date"].astype(str)
        return {"history": df_copy.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from core.rate_limiter import limiter
from fastapi import Request

@router.post("/chat")
@limiter.limit("5/minute")
def chat_endpoint(request: Request, req: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not req.messages:
        raise HTTPException(status_code=400, detail="Sem mensagens.")
        
    last_msg = req.messages[-1].get("content", "")
    if len(last_msg) > 1000:
        raise HTTPException(status_code=400, detail="A mensagem excede o limite de 1000 caracteres.")
        
    # Mantém apenas as últimas 10 mensagens
    truncated_messages = req.messages[-10:]
    try:
        reply = get_chat_response(truncated_messages)
        return {"reply": reply}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "ResourceExhausted" in error_msg:
            raise HTTPException(status_code=429, detail="A inteligência artificial está sobrecarregada no momento (limite gratuito excedido). Por favor, aguarde cerca de um minuto e tente novamente.")
        raise HTTPException(status_code=500, detail="Erro interno no servidor de IA. Tente novamente mais tarde.")
