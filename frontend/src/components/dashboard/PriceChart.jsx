import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PriceChart({ data = [] }) {
  // Formatar dados para exibir no gráfico
  const chartData = data.map(item => ({
    name: new Date(item.Date).toLocaleDateString("pt-BR", { month: "short" }),
    value: parseFloat(item.Close.toFixed(2))
  }));

  return (
    <div className="h-64 w-full">
      {chartData.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
          Sem dados disponíveis
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#0f1116", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
              itemStyle={{ color: "#22e6a0" }}
            />
            <Line type="monotone" dataKey="value" stroke="#22e6a0" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
