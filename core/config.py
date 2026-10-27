from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    gemini_api_key: str = ""
    secret_key: SecretStr
    algorithm: str = "HS256"
    access_token_expire_hours: int = 8
    db_path: str = "radar_b3.db"

    @property
    def gemini_api_keys_list(self) -> list[str]:
        if not self.gemini_api_key:
            return []
        # Support comma-separated keys
        return [k.strip() for k in self.gemini_api_key.split(",") if k.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        hide_input_in_errors=True,
        validate_assignment=True,
    )

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: SecretStr) -> SecretStr:
        key = value.get_secret_value()
        known_examples = {
            "radar-b3-secret-key-2024-mude-em-producao",
            "sua_secret_key_de_producao",
            "sua_chave_criptografica_de_32_bytes",
            "your-super-secret-key-with-at-least-32-characters",
        }
        repeated = any(
            all(character == key[index % width] for index, character in enumerate(key))
            for width in range(1, min(17, len(key) // 2 + 1))
        )
        if (
            len(key) < 32
            or key != key.strip()
            or len(set(key)) < 8
            or key.casefold() in known_examples
            or repeated
        ):
            raise ValueError(
                "SECRET_KEY must be an independently generated random secret: "
                "at least 32 characters, at least 8 distinct characters, "
                "no surrounding whitespace, known examples or short repeated patterns."
            )
        return value

settings = Settings()
