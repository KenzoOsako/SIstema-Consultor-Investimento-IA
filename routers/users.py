from fastapi import APIRouter, HTTPException, Depends
from core.security import get_current_user
from database.repositories import favorite_repo, chat_repo
from pydantic import BaseModel

router = APIRouter(prefix="/api/me", tags=["users"])

class ChatSaveRequest(BaseModel):
    role: str
    content: str

@router.get("/favorites")
def list_favorites(current_user: dict = Depends(get_current_user)):
    return {"favorites": favorite_repo.get_by_user(current_user["id"])}

@router.post("/favorites/{ticker}")
def add_fav(ticker: str, current_user: dict = Depends(get_current_user)):
    favorite_repo.add(current_user["id"], ticker)
    return {"message": f"{ticker.upper()} adicionado aos favoritos."}

@router.delete("/favorites/{ticker}")
def remove_fav(ticker: str, current_user: dict = Depends(get_current_user)):
    favorite_repo.remove(current_user["id"], ticker)
    return {"message": f"{ticker.upper()} removido dos favoritos."}

@router.get("/chat/history")
def list_chat_history(current_user: dict = Depends(get_current_user)):
    return {"history": chat_repo.get_by_user(current_user["id"])}

@router.post("/chat/history")
def save_chat_message(req: ChatSaveRequest, current_user: dict = Depends(get_current_user)):
    if req.role not in ("user", "assistant"):
        raise HTTPException(status_code=400, detail="Role deve ser 'user' ou 'assistant'.")
    chat_repo.append_message(current_user["id"], req.role, req.content)
    return {"message": "Mensagem salva."}

@router.delete("/chat/history")
def delete_chat_history(current_user: dict = Depends(get_current_user)):
    chat_repo.clear(current_user["id"])
    return {"message": "Histórico limpo."}
