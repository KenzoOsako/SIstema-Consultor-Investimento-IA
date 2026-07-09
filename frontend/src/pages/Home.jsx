import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const cards = [
  {
    emoji: "📊",
    title: "Análise de Ativos",
    desc: "Cotações, dividend yield e histórico de proventos em um painel institucional.",
    to: "/dashboard",
    accent: "emerald",
  },
  {
    emoji: "🤖",
    title: "Consultor IA",
    desc: "Converse com uma inteligência artificial especializada no mercado brasileiro.",
    to: "/consultor",
    accent: "cyan",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-emerald-400 mb-6">
            ● Mercado B3 em tempo real
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Radar de <span className="text-emerald-400 neon-text">Investimentos</span> B3
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Analise ativos, acompanhe proventos e tome decisões mais inteligentes com o
            apoio de inteligência artificial — tudo em um só painel.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <motion.button
              key={card.title}
              onClick={() => navigate(card.to)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              whileHover={{ y: -6 }}
              className={`group text-left glass rounded-3xl p-8 transition-all duration-300 hover:border-${card.accent}-400/40 hover:shadow-[0_0_40px_-10px_rgba(34,230,160,0.4)]`}
            >
              <div className="text-5xl mb-5">{card.emoji}</div>
              <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
              <p className="text-muted-foreground mb-6">{card.desc}</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
                Acessar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
