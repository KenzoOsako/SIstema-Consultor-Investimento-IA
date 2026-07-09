# Radar B3 - Assessor Virtual e Dashboard de Investimentos

O Radar B3 é uma plataforma institucional que integra análise de dados do mercado financeiro da B3 com um Assessor de Investimentos baseado em Inteligência Artificial. A aplicação tem como objetivo principal prover aos usuários acesso rápido a cotações, histórico de dividendos e orientações financeiras geradas por inteligência artificial, garantindo alta disponibilidade e resiliência.

Este repositório contém o sistema sob uma Arquitetura Híbrida: a API (Backend) desenvolvida em Python com o framework FastAPI gerencia a lógica de negócios e as requisições de Inteligência Artificial, e, simultaneamente, atua como servidor estático para os artefatos compilados do Frontend (desenvolvido em React).

## Tecnologias e Arquitetura

### Backend (Python/FastAPI)
- FastAPI e Uvicorn: Framework web assíncrono de alta performance operando na porta 5173.
- SQLite3: Banco de dados relacional embarcado com configurações de segurança adequadas aos padrões OWASP.
- Google GenAI (Gemini): Motor de Inteligência Artificial utilizado para as consultas do assessor financeiro.
  - Diferencial Técnico: Implementação de um sistema de Fallback Híbrido proprietário que realiza o rodízio automático entre múltiplas chaves de API e diversos modelos (e.g., gemini-3.5-flash, gemini-1.5-pro). Esta abordagem garante tolerância a falhas relacionadas a limites de cota (HTTP 429) ou indisponibilidade de modelos específicos (HTTP 404).
- yfinance: Biblioteca de extração de dados atualizados (cotações, dividendos) a partir do Yahoo Finance.
- Bcrypt e JWT (python-jose): Módulos responsáveis pela segurança, hash de senhas e autenticação de usuários baseada em sessões JWT assinaladas.
- SlowAPI: Middleware de Rate Limiting configurado para proteger os endpoints contra ataques de negação de serviço (DDoS) e mitigar abusos nas requisições à API de IA.

### Frontend (React/Vite)
- React.js e Vite: Single Page Application (SPA) com roteamento implementado via react-router-dom.
- Tailwind CSS: Framework de estilização utilitária para construção de interfaces responsivas.
- Integração Unificada: O roteamento relativo elimina a necessidade de configurações complexas de CORS, pois as chamadas à API são tratadas nativamente pelo mesmo servidor.

## Estrutura de Diretórios

O projeto obedece aos princípios de Clean Architecture e Layered Architecture, assegurando manutenibilidade e separação de responsabilidades:

- /frontend: Código-fonte e assets da aplicação React. Os artefatos otimizados de produção (/dist) são servidos a partir do diretório raiz do servidor Python.
- /core: Módulos de configuração do sistema, definições de segurança e políticas de Rate Limiting.
- /database: Inicialização do banco de dados SQLite e abstração das operações através do padrão Repository.
- /services: Lógica de negócio estritamente isolada (market_service.py para integração de dados financeiros e ai_service.py para orquestração da inteligência artificial).
- /routers: Controladores REST que expõem os endpoints da API.
- main.py: Ponto de entrada da aplicação que inicializa o FastAPI, configura o CORS, acopla os roteadores da API e gerencia a entrega de conteúdo estático do Frontend.

## Configuração e Implantação

### 1. Instalação (Backend)

```bash
# Criação e ativação do ambiente virtual
python -m venv venv
.\venv\Scripts\activate # Ambiente Windows
# source venv/bin/activate # Ambiente Linux/macOS

# Instalação das dependências
pip install -r requirements.txt
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (este arquivo não deve ser incluído no controle de versão). É suportada a definição de múltiplas chaves separadas por vírgula para balanceamento de carga:

```env
GEMINI_API_KEY=chave_1,chave_2,chave_3
SECRET_KEY=sua_chave_criptografica_de_32_bytes
DB_PATH=radar_b3.db
```

### 3. Build do Frontend

Caso seja necessário modificar e recompilar a interface do usuário, execute o processo de build do React:

```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Executando o Servidor Unificado

Inicie a aplicação FastAPI. O processo hospedará a API e servirá o Frontend simultaneamente:

```bash
uvicorn main:app --port 5173
```
Acesse `http://localhost:5173` no navegador de sua preferência para utilizar a plataforma completa.

---
Projeto desenvolvido com ênfase em Segurança (Padrões OWASP), Escalabilidade e Resiliência em Integrações de Inteligência Artificial.
