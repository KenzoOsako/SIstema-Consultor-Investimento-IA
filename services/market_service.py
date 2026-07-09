import yfinance as yf
import pandas as pd
import logging
from cachetools import cached, TTLCache

logger = logging.getLogger(__name__)

# Cache de 5 minutos (300 segundos) para até 100 ativos distintos
market_cache = TTLCache(maxsize=100, ttl=300)

@cached(cache=market_cache)
def get_ticker_info(ticker: str) -> dict:
    try:
        t = yf.Ticker(f"{ticker}.SA")
        info = t.info
        if "shortName" not in info:
            raise Exception(f"Ativo {ticker} não encontrado ou sem dados.")

        current_price = info.get("currentPrice") or info.get("regularMarketPrice", 0.0)

        hist = t.history(period="1y")
        divs_ltm = 0.0
        dividends_df = pd.DataFrame()

        if not hist.empty and "Dividends" in hist.columns:
            divs = hist["Dividends"]
            divs = divs[divs > 0]
            divs_ltm = divs.sum()
            if not divs.empty:
                dividends_df = divs.reset_index()
                dividends_df["Date"] = pd.to_datetime(dividends_df["Date"]).dt.date
                dividends_df.columns = ["Date", "Value"]
                dividends_df = dividends_df.sort_values("Date", ascending=False)
        
        # Calculation for DY (Dividend Yield)
        if divs_ltm > 0 and current_price > 0:
            dy = (divs_ltm / current_price) * 100
        else:
            # yfinance dividendYield is typically already expressed as a percentage (e.g. 12.84 for 12.84%)
            dy = info.get("dividendYield", 0.0)

        return {
            "ticker": ticker.upper(),
            "name": info.get("shortName", "N/A"),
            "current_price": current_price,
            "dy_ltm": dy,
            "divs_ltm": divs_ltm,
            "dividends_history": dividends_df
        }
    except Exception as e:
        logger.error(f"Erro em get_ticker_info({ticker}): {e}")
        raise

@cached(cache=market_cache)
def get_price_history(ticker: str, period: str = "1y") -> pd.DataFrame:
    try:
        t = yf.Ticker(f"{ticker}.SA")
        hist = t.history(period=period)
        if hist.empty:
            return pd.DataFrame()
        
        df = hist.reset_index()
        df["Date"] = pd.to_datetime(df["Date"]).dt.date
        return df[["Date", "Close"]]
    except Exception as e:
        logger.error(f"Erro em get_price_history({ticker}): {e}")
        raise

def get_current_price(ticker: str) -> float:
    """
    Retorna o preço atual de um ativo sem cache.
    Usada pelo scheduler de alertas a cada 60 segundos.
    Tenta o sufixo .SA (B3) primeiro; se falhar, tenta sem sufixo (ativos globais).
    """
    for symbol in [f"{ticker}.SA", ticker]:
        try:
            t = yf.Ticker(symbol)
            info = t.info
            price = info.get("currentPrice") or info.get("regularMarketPrice")
            if price:
                return float(price)
        except Exception:
            continue
    raise Exception(f"Não foi possível obter o preço atual para {ticker}.")

