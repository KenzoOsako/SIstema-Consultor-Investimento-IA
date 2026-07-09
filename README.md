# Radar B3 - Assessor Virtual e Dashboard de Investimentos

O **Radar B3** é uma plataforma completa que une análise de dados do mercado financeiro (B3) e um Assessor de Investimentos movido por IA, desenhado para ajudar os usuários a entenderem o mercado de ações brasileiro, consultar dividendos, histórico de preços, e receber orientações via inteligência artificial.

Este repositório contém a **API (Backend)** construída em Python (FastAPI).

## 🚀 Tecnologias

- **Python 3.11+**
- **FastAPI**: Framework web de alta performance para a API.
- **Uvicorn**: Servidor ASGI.
- **SQLite3**: Banco de dados relacional embarcado para armazenar usuários, favoritos e histórico de chat.
- **Google GenAI (Gemini 2.0 Flash)**: Motor de Inteligência Artificial para o assessor financeiro.
- **yfinance**: Extração de dados reais e atualizados (cotações, dividendos) do Yahoo Finance.
- **Bcrypt & JWT (python-jose)**: Segurança, hash de senhas e autenticação de usuários.
- **Pydantic & python-dotenv**: Validação de dados e gestão de configurações via variáveis de ambiente.

## 🏗️ Arquitetura do Backend

O backend foi recentemente refatorado para seguir padrões profissionais (Clean Architecture/Layered Architecture), melhorando a testabilidade, manutenção e escalabilidade.

- `/core`: Configurações de sistema (`config.py`) e segurança/autenticação (`security.py`).
- `/database`: Inicialização do SQLite (`connection.py`) e acesso a dados abstraído via Repositories (`repositories.py`).
- `/services`: Lógica de negócio isolada.
  - `market_service.py`: Integração com `yfinance`.
  - `ai_service.py`: Integração com a API do Google Gemini.
- `/routers`: Controladores/Endpoints REST da API (`auth.py`, `users.py`, `market.py`).
- `main.py`: Ponto de entrada da aplicação FastAPI.

## ⚙️ Configuração e Execução

### 1. Requisitos
- Python 3.11 ou superior.
- Uma chave de API válida do [Google AI Studio](https://aistudio.google.com/).

### 2. Instalação

```bash
# Clone ou acesse o diretório do backend
cd ProjetoAcessoInvetimento

# Crie um ambiente virtual
python -m venv venv
# Ative o ambiente (Windows)
.\venv\Scripts\activate
# Ative o ambiente (Linux/Mac)
# source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt
```

### 3. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do backend baseado no `.env.example`:

```env
GEMINI_API_KEY=sua_chave_do_gemini_aqui
SECRET_KEY=uma_chave_secreta_para_assinar_os_jwts
DB_PATH=radar_b3.db
```

### 4. Executando o Servidor

O banco de dados (SQLite) será inicializado automaticamente caso não exista.

```bash
uvicorn main:app --port 8001 --reload
```
A API estará disponível em `http://localhost:8001`. A documentação interativa pode ser acessada em `http://localhost:8001/docs`.

---

## 🔒 Endpoints Principais

### Autenticação
- `POST /api/auth/register`: Cria um novo usuário.
- `POST /api/auth/login`: Autentica o usuário e retorna o token JWT.
- `GET /api/auth/me`: Retorna os dados do usuário autenticado.

### Usuários (Requer Autenticação)
- `GET /api/me/favorites`: Lista os ativos favoritados pelo usuário.
- `POST /api/me/favorites/{ticker}`: Favorita um novo ativo.
- `DELETE /api/me/favorites/{ticker}`: Remove um ativo dos favoritos.
- `GET /api/me/chat/history`: Carrega o histórico de conversa com o Consultor IA salvo do usuário.
- `POST /api/me/chat/history`: Salva uma nova mensagem (do usuário ou da IA).
- `DELETE /api/me/chat/history`: Limpa o histórico de conversa.

### Mercado e Inteligência Artificial
- `GET /api/ticker/{ticker}`: Retorna os dados atuais e histórico de dividendos de um ativo (ex: PETR4).
- `GET /api/ticker/{ticker}/history?period=1y`: Retorna o histórico de preços.
- `POST /api/chat`: Processa o array de mensagens e retorna a resposta gerada pelo Google Gemini.
