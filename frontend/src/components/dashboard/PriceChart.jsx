import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

// ─── Períodos disponíveis ────────────────────────────────────────────────────
const PERIODS = [
  { label: "1M",  months: 1  },
  { label: "3M",  months: 3  },
  { label: "6M",  months: 6  },
  { label: "1A",  months: 12 },
  { label: "5A",  months: 60 },
];

// ─── Parse seguro de datas (evita deslocamento UTC→local) ───────────────────
// "2025-07-09" → partes inteiras → sem problema de timezone
function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ─── Tooltip customizado ────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div style={{
      background: "rgba(15,17,22,0.97)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "10px",
      padding: "10px 14px",
      minWidth: "140px",
    }}>
      <p style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>
        {point.fullDate}
      </p>
      <p style={{ color: "#22e6a0", fontWeight: 700, fontSize: "15px", margin: 0 }}>
        R$ {point.value.toFixed(2)}
      </p>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function PriceChart({ data = [] }) {
  const [activePeriod, setActivePeriod] = useState("1A");

  // 1) Converte e ordena os dados recebidos do backend
  const allData = useMemo(() => {
    return data
      .map(item => {
        const date = parseLocalDate(item.Date);
        return {
          date,                      // objeto Date — para filtrar e ordenar
          timestamp: date.getTime(), // número — para o eixo X (único por ponto)
          value: parseFloat(Number(item.Close).toFixed(2)),
          // Data completa para o tooltip: "09/07/2025"
          fullDate: date.toLocaleDateString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric"
          }),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  // 2) Filtra pelos meses do período selecionado
  const chartData = useMemo(() => {
    const months = PERIODS.find(p => p.label === activePeriod)?.months ?? 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return allData.filter(item => item.date >= cutoff);
  }, [allData, activePeriod]);

  // 3) Decide quantos ticks mostrar no eixo X (evita aglomeração)
  const xTickCount = useMemo(() => {
    const months = PERIODS.find(p => p.label === activePeriod)?.months ?? 12;
    if (months <= 1)  return 6;  // semanas
    if (months <= 3)  return 6;
    if (months <= 6)  return 6;
    if (months <= 12) return 12; // um por mês
    return 10;                   // 5 anos
  }, [activePeriod]);

  // 4) Formata o label do eixo X de acordo com o período
  const formatXTick = (timestamp) => {
    const d = new Date(timestamp);
    const months = PERIODS.find(p => p.label === activePeriod)?.months ?? 12;
    if (months <= 3) {
      // "09/jul"
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    }
    if (months <= 12) {
      // "jul/25"
      return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    }
    // 5 anos: "2022"
    return String(d.getFullYear());
  };

  // 5) Domínio do YAxis com margem de 2% para não colar na borda
  const yDomain = useMemo(() => {
    if (!chartData.length) return ["auto", "auto"];
    const values = chartData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.05 || 0.5;
    return [parseFloat((min - pad).toFixed(2)), parseFloat((max + pad).toFixed(2))];
  }, [chartData]);

  return (
    <div>
      {/* Seletor de período */}
      <div className="flex items-center gap-1 mb-5">
        {PERIODS.map(p => (
          <button
            key={p.label}
            onClick={() => setActivePeriod(p.label)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePeriod === p.label
                ? "bg-emerald-400/15 text-emerald-400"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Gráfico */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
            Sem dados disponíveis para o período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickCount={xTickCount}
                tickFormatter={formatXTick}
                stroke="#555"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={6}
              />
              <YAxis
                domain={yDomain}
                stroke="#555"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `R$${v.toFixed(0)}`}
                width={52}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22e6a0"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#22e6a0", stroke: "#0f1116", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
