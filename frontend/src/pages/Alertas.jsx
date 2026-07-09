import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellPlus, Trash2, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Loader2, ShieldAlert,
  ShieldCheck, Lightbulb, Minus, CheckCircle2, Clock
} from "lucide-react";
import { api } from "@/api/client";

// ─── Badge de classificação do Gemini ───────────────────────────────────────
function ClassificationBadge({ classification }) {
  const map = {
    RISCO_ALTO:         { label: "Risco Alto",         color: "text-red-400 bg-red-400/10 border-red-400/20", icon: ShieldAlert },
    RISCO_MODERADO:     { label: "Risco Moderado",     color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: ShieldAlert },
    OPORTUNIDADE_POTENCIAL: { label: "Oportunidade",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: Lightbulb },
    NEUTRO:             { label: "Neutro",             color: "text-slate-400 bg-slate-400/10 border-slate-400/20", icon: Minus },
  };
  const cfg = map[classification] || map.NEUTRO;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" /> {cfg.label}
    </span>
  );
}

// ─── Card de um alerta disparado (histórico) ────────────────────────────────
function DispatchCard({ dispatch }) {
  const [open, setOpen] = useState(false);
  const analysis = dispatch.analysis_payload;
  const typeLabel = dispatch.alert_type === "PRICE_ABOVE" ? "Resistência atingida" : "Suporte atingido";
  const TypeIcon = dispatch.alert_type === "PRICE_ABOVE" ? TrendingUp : TrendingDown;
  const typeColor = dispatch.alert_type === "PRICE_ABOVE" ? "text-emerald-400" : "text-red-400";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${dispatch.alert_type === "PRICE_ABOVE" ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
            <TypeIcon className={`w-5 h-5 ${typeColor}`} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{dispatch.ticker}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{typeLabel} · R$ {dispatch.trigger_price?.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {analysis && <ClassificationBadge classification={analysis.classification} />}
          <span className="text-xs text-muted-foreground hidden sm:block">
            {new Date(dispatch.triggered_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {open && analysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/5 overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {/* Análise técnica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Análise do Gatilho</p>
                  <p className="text-sm leading-relaxed">{analysis.trigger_analysis}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Contexto de Preço (5 dias)</p>
                  <p className="text-sm leading-relaxed">{analysis.price_context}</p>
                </div>
              </div>

              {/* Notícias */}
              <div className="bg-white/[0.03] rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Impacto de Notícias</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    analysis.news_sentiment === "POSITIVO" ? "bg-emerald-400/10 text-emerald-400" :
                    analysis.news_sentiment === "NEGATIVO" ? "bg-red-400/10 text-red-400" :
                    "bg-slate-400/10 text-slate-400"
                  }`}>{analysis.news_sentiment}</span>
                </div>
                <p className="text-sm leading-relaxed">{analysis.news_impact_assessment}</p>
              </div>

              {/* Riscos e Oportunidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.risks?.length > 0 && (
                  <div className="bg-red-400/5 border border-red-400/10 rounded-xl p-4">
                    <p className="text-xs text-red-400 font-medium mb-2">Riscos Identificados</p>
                    <ul className="space-y-1.5">
                      {analysis.risks.map((r, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-red-400/60 mt-0.5">•</span>{r}</li>)}
                    </ul>
                  </div>
                )}
                {analysis.opportunities?.length > 0 && (
                  <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-xl p-4">
                    <p className="text-xs text-emerald-400 font-medium mb-2">Oportunidades</p>
                    <ul className="space-y-1.5">
                      {analysis.opportunities.map((o, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-emerald-400/60 mt-0.5">•</span>{o}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confiança */}
              {analysis.confidence_score !== undefined && (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">Confiança da Análise</p>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${(analysis.confidence_score * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-emerald-400">{(analysis.confidence_score * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Card de alerta ativo configurado ───────────────────────────────────────
function AlertConfigCard({ config, onDelete }) {
  const typeLabel = config.alert_type === "PRICE_ABOVE" ? "Acima de" : "Abaixo de";
  const TypeIcon = config.alert_type === "PRICE_ABOVE" ? TrendingUp : TrendingDown;
  const color = config.alert_type === "PRICE_ABOVE" ? "text-emerald-400" : "text-red-400";
  const bgColor = config.alert_type === "PRICE_ABOVE" ? "bg-emerald-400/10" : "bg-red-400/10";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-2xl p-4 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${bgColor}`}>
          <TypeIcon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm">{config.ticker}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {typeLabel} <span className={`font-medium ${color}`}>R$ {config.threshold_value?.toFixed(2)}</span>
            <span className="mx-1.5 text-white/20">·</span>
            <Clock className="w-3 h-3 inline -mt-0.5 mr-0.5" />cooldown {config.cooldown_hours}h
          </p>
        </div>
      </div>
      <button
        onClick={() => onDelete(config.id)}
        className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
        title="Remover alerta"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function Alertas() {
  const [configs, setConfigs] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("configs");
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [form, setForm] = useState({
    ticker: "",
    alert_type: "PRICE_BELOW",
    threshold_value: "",
    cooldown_hours: 4,
  });

  const fetchConfigs = useCallback(async () => {
    setLoadingConfigs(true);
    try {
      const res = await api.get("/api/alerts");
      if (res?.ok) setConfigs(await res.json());
    } finally { setLoadingConfigs(false); }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/api/alerts/history");
      if (res?.ok) setHistory(await res.json());
    } finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => { fetchConfigs(); fetchHistory(); }, [fetchConfigs, fetchHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(""); setFormSuccess("");
    if (!form.ticker.trim() || !form.threshold_value) {
      setFormError("Preencha o ticker e o valor do gatilho.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/api/alerts", {
        ticker: form.ticker.trim().toUpperCase(),
        alert_type: form.alert_type,
        threshold_value: parseFloat(form.threshold_value),
        cooldown_hours: parseInt(form.cooldown_hours),
      });
      if (res?.ok) {
        setFormSuccess("Alerta criado com sucesso! O sistema começará a monitorar em até 60 segundos.");
        setForm({ ticker: "", alert_type: "PRICE_BELOW", threshold_value: "", cooldown_hours: 4 });
        fetchConfigs();
      } else {
        const err = await res.json();
        setFormError(err.detail || "Erro ao criar alerta.");
      }
    } catch { setFormError("Falha na comunicação com o servidor."); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    const res = await api.delete(`/api/alerts/${id}`);
    if (res?.ok) setConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  const activeConfigs = configs.filter((c) => c.is_active);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 grid place-items-center neon-glow" style={{ boxShadow: "0 0 24px rgba(251,191,36,0.15)" }}>
          <Bell className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alertas Inteligentes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitore suportes e resistências — o sistema avisa com análise do Gemini</p>
        </div>
      </motion.div>

      {/* Formulário de criação */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-5 flex items-center gap-2">
          <BellPlus className="w-4 h-4 text-amber-400" /> Novo Alerta de Preço
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Ticker</label>
            <input
              value={form.ticker}
              onChange={(e) => setForm((p) => ({ ...p, ticker: e.target.value.toUpperCase() }))}
              placeholder="Ex: PETR4"
              maxLength={10}
              className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-amber-400/50 transition-all uppercase placeholder:normal-case"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Tipo de Alerta</label>
            <select
              value={form.alert_type}
              onChange={(e) => setForm((p) => ({ ...p, alert_type: e.target.value }))}
              className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-amber-400/50 transition-all"
            >
              <option value="PRICE_BELOW">Preço Abaixo de (Suporte)</option>
              <option value="PRICE_ABOVE">Preço Acima de (Resistência)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.threshold_value}
              onChange={(e) => setForm((p) => ({ ...p, threshold_value: e.target.value }))}
              placeholder="Ex: 38.50"
              className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-amber-400/50 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Cooldown (horas)</label>
            <select
              value={form.cooldown_hours}
              onChange={(e) => setForm((p) => ({ ...p, cooldown_hours: e.target.value }))}
              className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-amber-400/50 transition-all"
            >
              {[1,2,4,8,12,24].map(h => <option key={h} value={h}>{h}h</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 text-black font-semibold text-sm hover:bg-amber-300 transition-all disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellPlus className="w-4 h-4" />}
              {submitting ? "Salvando..." : "Criar Alerta"}
            </button>
            {formError && <p className="text-sm text-red-400 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" />{formError}</p>}
            {formSuccess && <p className="text-sm text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />{formSuccess}</p>}
          </div>
        </form>
      </motion.div>

      {/* Tabs */}
      <div>
        <div className="flex items-center gap-1 mb-6 border-b border-white/5">
          {[
            { key: "configs", label: `Ativos (${activeConfigs.length})` },
            { key: "history", label: `Histórico (${history.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                tab === t.key
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Alertas ativos */}
        <AnimatePresence mode="wait">
          {tab === "configs" && (
            <motion.div key="configs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {loadingConfigs && <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 text-amber-400 animate-spin" /></div>}
              {!loadingConfigs && activeConfigs.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhum alerta configurado ainda.</p>
                  <p className="text-xs mt-1 opacity-60">Preencha o formulário acima para começar a monitorar.</p>
                </div>
              )}
              <AnimatePresence>
                {activeConfigs.map((c) => (
                  <AlertConfigCard key={c.id} config={c} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Histórico de disparos */}
          {tab === "history" && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {loadingHistory && <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 text-amber-400 animate-spin" /></div>}
              {!loadingHistory && history.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhum alerta foi disparado ainda.</p>
                  <p className="text-xs mt-1 opacity-60">Quando um gatilho for acionado, a análise do Gemini aparecerá aqui.</p>
                </div>
              )}
              {history.map((d) => <DispatchCard key={d.id} dispatch={d} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
