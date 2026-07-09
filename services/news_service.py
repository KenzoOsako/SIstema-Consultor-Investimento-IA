import logging
import httpx
from xml.etree import ElementTree

logger = logging.getLogger(__name__)

GOOGLE_NEWS_RSS_URL = "https://news.google.com/rss/search"

def get_recent_news(ticker: str, hours: int = 4) -> list[dict]:
    """
    Busca as headlines mais recentes para um dado ticker via Google News RSS.
    Retorna uma lista de dicts com title, source e published.
    Nao requer API key e nao possui rate limits explícitos.
    """
    search_term = ticker.replace(".SA", "").replace(".sa", "")
    try:
        params = {"q": search_term, "hl": "pt-BR", "gl": "BR", "ceid": "BR:pt-419"}
        headers = {"User-Agent": "Mozilla/5.0 (compatible; RadarB3Bot/1.0)"}
        with httpx.Client(timeout=10) as client:
            response = client.get(GOOGLE_NEWS_RSS_URL, params=params, headers=headers)
            response.raise_for_status()
        root = ElementTree.fromstring(response.content)
        channel = root.find("channel")
        if channel is None:
            return []
        news_items = []
        for item in channel.findall("item")[:5]:
            title = item.findtext("title", default="")
            source_el = item.find("source")
            source = source_el.text if source_el is not None else "Google News"
            pub_date = item.findtext("pubDate", default="")
            if title:
                news_items.append({"title": title, "source": source, "published": pub_date})
        logger.info(f"Encontradas {len(news_items)} noticias para {ticker}.")
        return news_items
    except Exception as e:
        logger.warning(f"Falha ao buscar noticias para {ticker}: {e}")
        return []
