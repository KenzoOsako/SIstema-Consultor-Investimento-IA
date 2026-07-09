import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, TrendingUp, DollarSign, Percent, Wallet, Loader2, Star
} from "lucide-react";
import PriceChart from "@/components/dashboard/PriceChart";
import DividendTable from "@/components/dashboard/DividendTable";
import { api } from "@/api/client";
import { useFavorites } from "@/hooks/useFavorites";

function Kpi({ icon: Icon, label, value, sub, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-3">
        <Icon className="w-4 h-4 text-emerald-400" />
        {label}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value || "---"}</p>
      {sub && <p className="text-sm mt-1 text-emerald-400">{sub}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const [query, setQuery] = useState("PETR4");
  const [searchInput, setSearchInput] = useState("PETR4");
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { favorites, toggleFavorite, isFavorited, loading: favLoading } = useFavorites();

  // Buscar dados do ticker selecionado
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [resInfo, resHist] = await Promise.all([
          api.get(`/api/ticker/${query}`),
          api.get(`/api/ticker/${query}/history`),
        ]);

        if (!resInfo || !resInfo.ok) {
          const errData = await resInfo?.json();
          throw new Error(errData?.detail || "Ativo não encontrado.");
        }

        const jsonInfo = await resInfo.json();
        setData(jsonInfo);

        if (resHist && resHist.ok) {
          const jsonHist = await resHist.json();
          setHistory(jsonHist.history || []);
        }
      } catch (e) {
        setError(e.message);
        setData(null);
        setHistory([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput.trim().toUpperCase());
    }
  };

  const isFav = isFavorited(query);

  const MOCK = data
    ? {
        ticker: data.ticker,
        name: data.name || "Empresa",
        price: `R$ ${data.current_price?.toFixed(2) || "0,00"}`,
        change: "---",
        dy: `${data.dy_ltm?.toFixed(2) || "0"}%`,
        ltm: `R$ ${data.divs_ltm?.toFixed(2) || "0,00"}`,
      }
    : {
        ticker: query,
        name: error ? "Ativo não encontrado" : "Carregando...",
        price: "---",
        change: "---",
        dy: "---",
        ltm: "---",
      };

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      {/* Sidebar esquerda */}
      <div className="lg:w-72 shrink-0 p-6 lg:border-r border-white/5">
        <label className="text-xs font-medium text-muted-foreground">Pesquisar Ticker</label>
        <form onSubmit={handleSearch} className="mt-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            placeholder="Ex: PETR4"
            className="w-full pl-9 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-emerald-400/50 transition-all uppercase"
          />
        </form>

        {/* Ativos sugeridos */}
        <div className="mt-5 space-y-1">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Sugestões</p>
          {["PETR4", "VALE3", "ITUB4", "BBAS3"].map((t) => (
            <button
              key={t}
              onClick={() => { setSearchInput(t); setQuery(t); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all ${
                query === t ? "bg-emerald-400/10 text-emerald-400" : "text-muted-foreground hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Favoritos */}
        {favorites.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" /> Meus Favoritos
            </p>
            <div className="space-y-1">
              {favorites.map((f) => (
                <button
                  key={f.ticker}
                  onClick={() => { setSearchInput(f.ticker); setQuery(f.ticker); }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    query === f.ticker
                      ? "bg-yellow-400/10 text-yellow-400"
                      : "text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  <Star className="w-3 h-3 text-yellow-400 shrink-0" />
                  {f.ticker}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 p-6 space-y-6 min-w-0 relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-[#0a0b0e]/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* KPIs com botão de favoritar */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">
            {data ? `${data.name}` : ""}
          </p>
          {data && (
            <button
              onClick={() => toggleFavorite(query)}
              disabled={favLoading}
              title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isFav
                  ? "bg-yellow-400/15 text-yellow-400 hover:bg-yellow-400/25"
                  : "bg-white/5 text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFav ? "fill-yellow-400" : ""}`} />
              {isFav ? "Favoritado" : "Favoritar"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi icon={TrendingUp} label="Ativo" value={MOCK.ticker} sub={MOCK.name} delay={0} />
          <Kpi icon={DollarSign} label="Preço Atual" value={MOCK.price} sub={MOCK.change} delay={0.05} />
          <Kpi icon={Percent} label="Dividend Yield" value={MOCK.dy} sub="12 meses" delay={0.1} />
          <Kpi icon={Wallet} label="Total Pago (LTM)" value={MOCK.ltm} sub="por ação" delay={0.15} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Evolução da Cotação</h3>
            <span className="text-xs text-muted-foreground">Últimos 12 meses</span>
          </div>
          <PriceChart data={history} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="font-semibold mb-5">Histórico de Dividendos</h3>
          <DividendTable dividends={data?.dividends_history || []} />
        </motion.div>
      </div>
    </div>
  );
}
