import React from "react";

export default function DividendTable({ dividends = [] }) {
  if (!dividends || dividends.length === 0) {
    return (
      <div className="w-full text-center py-6 text-sm text-muted-foreground">
        Nenhum histórico de dividendos encontrado.
      </div>
    );
  }

  return (
    <div className="w-full max-h-64 overflow-y-auto scrollbar-thin pr-2">
      <table className="w-full text-sm text-left text-muted-foreground">
        <thead className="text-xs uppercase bg-white/5 text-foreground rounded-t-lg sticky top-0 backdrop-blur-md">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Data Ex</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3 rounded-tr-lg">Valor</th>
          </tr>
        </thead>
        <tbody>
          {dividends.slice(0, 50).map((div, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
              <td className="px-4 py-3">{new Date(div.Date).toLocaleDateString("pt-BR")}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-400/10 text-emerald-400`}>
                  Rendimento
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-foreground">R$ {parseFloat(div.Value).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
