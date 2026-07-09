# Radar B3 - Assessor Virtual e Dashboard de Investimentos

O **Radar B3** é uma plataforma completa que une análise de dados do mercado financeiro (B3) e um Assessor de Investimentos movido por IA. Com esta aplicação, usuários podem entender o mercado de ações brasileiro, consultar dividendos, histórico de preços, e receber orientações via inteligência artificial com extrema resiliência e segurança.

Este repositório contém o sistema unificado em **Arquitetura Híbrida**: a **API (Backend)** construída em Python (FastAPI) gerencia a lógica de dados e Inteligência Artificial, e, simultaneamente, serve os arquivos estáticos compilados do **Frontend (React)**.

## 🚀 Tecnologias e Arquitetura

### Backend (Python/FastAPI)
- **FastAPI & Uvicorn**: Framework web de alta performance rodando na porta `5173`.
- **SQLite3**: Banco de dados relacional embarcado (dados protegidos via OWASP).
- **Google GenAI (Gemini)**: Motor de Inteligência Artificial para o assessor financeiro.
  - *Diferencial*: Conta com um sistema proprietário de **Fallback Híbrido** que reveza automaticamente entre múltiplas chaves de API e dezenas de modelos (ex: `gemini-3.5-flash`, `gemini-1.5-pro`) garantindo que falhas de cota (429) ou modelos inacessíveis (404) não interrompam a experiência do usuário.
- **yfinance**: Extração de dados reais e atualizados (cotações, dividendos) do Yahoo Finance.
- **Bcrypt & JWT (python-jose)**: Segurança, hash de senhas e autenticação de usuários baseada em sessões JWT seguras.
- **SlowAPI**: Rate Limiting rigoroso para proteger os endpoints contra ataques DDoS e abusos na API da IA.

### Frontend (React/Vite)
- **React.js & Vite**: SPA veloz com roteamento cliente (`react-router-dom`).
- **Tailwind CSS**: Estilização profissional e interface responsiva.
- **Integração Unificada**: O frontend não sofre com CORS, pois as chamadas `/api` são encaminhadas de forma nativa e relativa.

## 🏗️ Estrutura de Diretórios (Nível de Produção)

O projeto segue padrões profissionais Clean/Layered Architecture:

- `/frontend`: Todo o código fonte e assets do React. Os arquivos otimizados (`dist`) são servidos pela raiz do servidor Python.
- `/core`: Configurações de sistema, segurança OWASP e Rate Limiters.
- `/database`: Inicialização do SQLite e abstração de Repositories.
- `/services`: Lógica de negócio isolada (`market_service.py` para B3 e `ai_service.py` para IA com fallback inteligente).
- `/routers`: Controladores REST.
- `main.py`: O coração do sistema. Gerencia o CORS, inicializa a aplicação FastAPI e orquestra a entrega da API (`/api/*`) e as rotas de Frontend (`/*`).

## ⚙️ Configuração e Execução

### 1. Instalação (Backend)

```bash
# Crie e ative um ambiente virtual
python -m venv venv
.\venv\Scripts\activate # Windows
# source venv/bin/activate # Linux/Mac

# Instale as dependências da API
pip install -r requirements.txt
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (nunca comite esse arquivo). Ele pode aceitar múltiplas chaves separadas por vírgula para aumentar o limite gratuito:

```env
GEMINI_API_KEY=chave_1,chave_2,chave_3
SECRET_KEY=uma_chave_super_segura_de_32_bytes
DB_PATH=radar_b3.db
```

### 3. Build do Frontend

Caso deseje atualizar a interface, é necessário compilar os assets do React:

```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Executando o Servidor Unificado

Basta iniciar o FastAPI. Ele hospedará a API e o site simultaneamente:

```bash
uvicorn main:app --port 5173
```
Acesse `http://localhost:5173` no seu navegador. O painel e o chat de IA estarão online!

---
*Este projeto foi arquitetado focado em Segurança (Padrões OWASP), Escalabilidade e Resiliência de IA.*
