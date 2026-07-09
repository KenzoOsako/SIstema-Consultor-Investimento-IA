import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChat } from "@/hooks/useChat";

const WELCOME = {
  role: "assistant",
  content:
    "Olá! Sou o Consultor IA do Radar B3. Posso te ajudar a entender ativos, dividendos e estratégias de investimento na B3. Como posso ajudar?",
};

const SUGGESTIONS = [
  "O que é Dividend Yield?",
  "PETR4 é uma boa pagadora de dividendos?",
  "Como montar uma carteira de renda passiva?",
];

export default function Consultor() {
  const { messages, loading, historyLoaded, sendMessage, clearHistory } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    await sendMessage(content);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] md:h-screen max-h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-400/10 grid place-items-center">
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold leading-tight">Consultor IA</p>
          <p className="text-xs text-muted-foreground">Especialista em mercado B3</p>
        </div>
        <button
          onClick={clearHistory}
          title="Limpar conversa"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Limpar
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${
                  m.role === "user"
                    ? "bg-emerald-400/15 text-emerald-400"
                    : "bg-cyan-400/15 text-cyan-400"
                }`}
              >
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%] overflow-hidden ${
                  m.role === "user"
                    ? "bg-emerald-400/10 rounded-tr-sm"
                    : "glass rounded-tl-sm prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10"
                }`}
              >
                {m.role === "user" ? (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                ) : (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg grid place-items-center bg-cyan-400/15 text-cyan-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="w-2 h-2 rounded-full bg-cyan-400/60 animate-bounce"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={loading}
                  className="px-3 py-2 rounded-full text-xs glass hover:border-cyan-400/40 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/5 p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="max-w-3xl mx-auto flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Pergunte sobre ativos, dividendos, estratégias..."
            className="flex-1 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-cyan-400/50 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-xl bg-emerald-400 text-[#0f1116] grid place-items-center disabled:opacity-40 hover:brightness-110 transition-all neon-glow shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
