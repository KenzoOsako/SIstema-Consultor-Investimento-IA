from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str = ""
    secret_key: str = "radar-b3-secret-key-2024-mude-em-producao"
    algorithm: str = "HS256"
    access_token_expire_hours: int = 8
    db_path: str = "radar_b3.db"

    @property
    def gemini_api_keys_list(self) -> list[str]:
        if not self.gemini_api_key:
            return []
        # Support comma-separated keys
        return [k.strip() for k in self.gemini_api_key.split(",") if k.strip()]

    class Config:
        env_file = ".env"

settings = Settings()
