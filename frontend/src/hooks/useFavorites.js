import { useState, useEffect } from "react";
import { api } from "@/api/client";

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const res = await api.get("/api/me/favorites");
        if (!res || !res.ok) return;
        const json = await res.json();
        setFavorites(json.favorites || []);
      } catch (err) {
        console.error("Erro ao carregar favoritos", err);
      }
    }
    loadFavorites();
  }, []);

  const toggleFavorite = async (ticker) => {
    const isFav = favorites.some((f) => f.ticker === ticker);
    setLoading(true);
    try {
      if (isFav) {
        await api.delete(`/api/me/favorites/${ticker}`);
        setFavorites((prev) => prev.filter((f) => f.ticker !== ticker));
      } else {
        await api.post(`/api/me/favorites/${ticker}`, {});
        setFavorites((prev) => [{ ticker, created_at: new Date().toISOString() }, ...prev]);
      }
    } catch (err) {
        console.error("Erro ao alternar favorito", err);
    }
    setLoading(false);
  };

  const isFavorited = (ticker) => favorites.some((f) => f.ticker === ticker);

  return { favorites, toggleFavorite, isFavorited, loading };
}
