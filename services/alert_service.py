import json
import logging
from database.repositories import alert_repo
from services.market_service import get_current_price, get_price_history
from services.news_service import get_recent_news
from services.ai_service import get_alert_analysis

logger = logging.getLogger(__name__)


class AlertOrchestrator:
    """
    Orquestra a detecção de gatilhos de preço e o enriquecimento de alertas com IA.
    Executado como background jobs pelo APScheduler integrado ao FastAPI.
    """

    def run_price_check(self) -> None:
        """Job 1 - Executado a cada 60 segundos. Verifica gatilhos de preço."""
        tickers = alert_repo.get_distinct_monitored_tickers()
        if not tickers:
            return
        logger.info(f"[AlertJob] Verificando {len(tickers)} ticker(s): {tickers}")
        for ticker in tickers:
            try:
                current_price = get_current_price(ticker)
                alert_repo.upsert_price(ticker, current_price)
                self._evaluate_price_triggers(ticker, current_price)
            except Exception as e:
                logger.error(f"[AlertJob] Erro ao verificar {ticker}: {e}")

    def _evaluate_price_triggers(self, ticker: str, current_price: float) -> None:
        configs = alert_repo.get_active_price_configs(ticker)
        for config in configs:
            triggered = False
            alert_type = config["alert_type"]
            threshold = config["threshold_value"]
            if alert_type == "PRICE_BELOW" and current_price <= threshold:
                triggered = True
            elif alert_type == "PRICE_ABOVE" and current_price >= threshold:
                triggered = True
            if triggered:
                logger.info(f"[AlertJob] Gatilho {alert_type} acionado: {ticker} @ {current_price} (limiar: {threshold})")
                self._enqueue_alert(config, ticker, current_price)

    def _enqueue_alert(self, config: dict, ticker: str, price: float) -> None:
        if alert_repo.is_in_cooldown(config["id"]):
            logger.debug(f"[AlertJob] Alerta {config['id']} em cooldown. Ignorando.")
            return
        alert_repo.create_dispatch(
            config_id=config["id"],
            user_id=config["user_id"],
            ticker=ticker,
            trigger_price=price,
            cooldown_hours=config.get("cooldown_hours", 4),
        )
        logger.info(f"[AlertJob] Dispatch criado para config {config['id']} ({ticker}).")

    def run_alert_processor(self) -> None:
        """Job 2 - Executado a cada 30 segundos. Enriquece alertas pendentes com IA."""
        pending = alert_repo.get_pending_dispatches(limit=5)
        if not pending:
            return
        logger.info(f"[AlertJob] Processando {len(pending)} alerta(s) pendente(s).")
        for dispatch in pending:
            dispatch_id = dispatch["id"]
            try:
                alert_repo.update_dispatch_status(dispatch_id, "PROCESSING")
                payload = self._build_enriched_payload(dispatch)
                payload_json = json.dumps(payload, ensure_ascii=False)
                alert_repo.update_dispatch_delivered(dispatch_id, payload_json)
                logger.info(f"[AlertJob] Dispatch {dispatch_id} entregue com sucesso.")
            except Exception as e:
                logger.error(f"[AlertJob] Falha no dispatch {dispatch_id}: {e}")
                alert_repo.update_dispatch_status(dispatch_id, "FAILED", error=str(e))

    def _build_enriched_payload(self, dispatch: dict) -> dict:
        ticker = dispatch["ticker"]
        price_history = get_price_history(ticker, period="5d")
        news = get_recent_news(ticker, hours=4)

        # Serializa o histórico para formato JSON-safe
        if hasattr(price_history, "to_dict"):
            price_history_data = price_history.to_dict(orient="records")
        elif isinstance(price_history, list):
            price_history_data = price_history
        else:
            price_history_data = []

        gemini_analysis = get_alert_analysis(
            ticker=ticker,
            trigger_type=dispatch["alert_type"],
            trigger_price=dispatch["trigger_price"],
            threshold_value=dispatch["threshold_value"],
            price_history=price_history_data,
            news_headlines=news,
        )

        return {
            "ticker": ticker,
            "trigger_type": dispatch["alert_type"],
            "trigger_price": dispatch["trigger_price"],
            "threshold": dispatch["threshold_value"],
            "triggered_at": dispatch["triggered_at"],
            "price_history_5d": price_history_data,
            "news": news,
            "gemini_analysis": gemini_analysis,
        }


orchestrator = AlertOrchestrator()
