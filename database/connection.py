import sqlite3
import logging
from core.config import settings

logger = logging.getLogger(__name__)

def get_connection():
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                ticker TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, ticker),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Alertas configurados pelo usuário (suportes e resistências)
            CREATE TABLE IF NOT EXISTS alert_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                ticker TEXT NOT NULL,
                alert_type TEXT NOT NULL CHECK (alert_type IN ('PRICE_BELOW', 'PRICE_ABOVE', 'SENTIMENT')),
                threshold_value REAL,
                sentiment_keywords TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                cooldown_hours INTEGER NOT NULL DEFAULT 4,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, ticker, alert_type, threshold_value)
            );

            -- Registro histórico de cada disparo (garante idempotência)
            CREATE TABLE IF NOT EXISTS alert_dispatches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_config_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                ticker TEXT NOT NULL,
                triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                trigger_price REAL,
                cooldown_until TIMESTAMP NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED')),
                analysis_payload TEXT,
                error_message TEXT,
                FOREIGN KEY (alert_config_id) REFERENCES alert_configs(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Cache dos preços monitorados (atualizado a cada ciclo de polling)
            CREATE TABLE IF NOT EXISTS price_cache (
                ticker TEXT PRIMARY KEY,
                current_price REAL NOT NULL,
                previous_close REAL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {e}")
    finally:
        conn.close()
