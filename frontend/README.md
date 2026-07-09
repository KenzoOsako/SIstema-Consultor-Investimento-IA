# Radar B3 - Frontend

Este é o cliente Web (Frontend) do **Radar B3**, uma aplicação voltada à consulta de ativos da B3 e interações com um Consultor de Investimentos de Inteligência Artificial.

## 🚀 Tecnologias

- **React + Vite**
- **React Router DOM**: Para navegação (Login, Registro, Dashboard, Consultor).
- **TailwindCSS**: Para estilização rápida e responsiva.
- **Framer Motion**: Para animações e micro-interações dinâmicas.
- **Recharts**: Para os gráficos de preços dos ativos.
- **Lucide React**: Ícones da interface.
- **React Markdown**: Para renderizar as respostas em Markdown da IA.

## 🏗️ Arquitetura

O frontend foi desenvolvido com foco em separação de responsabilidades (Separation of Concerns). Recentemente, hooks customizados foram implementados para abstrair o estado e as lógicas de API das interfaces.

- `/src/api`: Cliente HTTP configurado para injetar automaticamente o token JWT nas requisições.
- `/src/hooks`: 
  - `useFavorites.js`: Gerencia a lista de favoritos e a lógica de favoritar/desfavoritar na API.
  - `useChat.js`: Gerencia as mensagens, o envio para o Gemini e a persistência do histórico no backend.
- `/src/pages`: Páginas principais da aplicação (`Dashboard.jsx`, `Consultor.jsx`, `Login.jsx`, `Register.jsx`).
- `/src/components`: Componentes reutilizáveis como `PriceChart`, `DividendTable` e layouts.

## ⚙️ Configuração e Execução

### 1. Instalação

```bash
cd FrontendRadar
npm install
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (onde fica o `package.json`) baseado no `.env.example`:

```env
VITE_API_URL=http://localhost:8001
```

*(O Vite substitui todas as variáveis prefixadas por `VITE_` durante a construção da aplicação).*

### 3. Executando Localmente

Para rodar a aplicação em modo de desenvolvimento (o Vite iniciará um servidor de dev, tipicamente na porta 5173):

```bash
npm run dev
```

Abra o navegador em `http://localhost:5173`.
O Frontend conectará ao Backend (FastAPI) rodando em `http://localhost:8001`.
