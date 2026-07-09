from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from core.security import create_access_token, verify_password, hash_password, get_current_user
from database.repositories import user_repo

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(req: RegisterRequest):
    if len(req.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Usuário deve ter ao menos 3 caracteres.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter ao menos 6 caracteres.")

    existing = user_repo.get_by_username(req.username.strip())
    if existing:
        raise HTTPException(status_code=409, detail="Nome de usuário já está em uso.")

    hashed = hash_password(req.password)
    user_id = user_repo.create(req.username.strip(), hashed)
    token = create_access_token({"sub": str(user_id)})
    return {"access_token": token, "token_type": "bearer", "username": req.username.strip()}

from core.rate_limiter import limiter
from fastapi import Request

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, form: OAuth2PasswordRequestForm = Depends()):
    user = user_repo.get_by_username(form.username)
    if not user or not verify_password(form.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos.")

    token = create_access_token({"sub": str(user["id"])})
    return {"access_token": token, "token_type": "bearer", "username": user["username"]}

@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user["id"], "username": current_user["username"]}
