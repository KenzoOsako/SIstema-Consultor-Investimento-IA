from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str = ""
    secret_key: str = Field(min_length=32, repr=False)
    algorithm: str = "HS256"
    access_token_expire_hours: int = 8
    db_path: str = "radar_b3.db"

    @field_validator("secret_key")
    @classmethod
    def validate_secret(cls, value: str) -> str:
        if value != value.strip() or not value.strip() or value == "radar-b3-secret-key-2024-mude-em-producao":
            raise ValueError("SECRET_KEY deve ser uma chave própria, sem espaços nas extremidades.")
        return value

    @property
    def gemini_api_keys_list(self) -> list[str]:
        if not self.gemini_api_key:
            return []
        # Support comma-separated keys
        return [k.strip() for k in self.gemini_api_key.split(",") if k.strip()]

    class Config:
        env_file = ".env"
        hide_input_in_errors = True

settings = Settings()
