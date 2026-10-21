# Radar B3 - Assessor Virtual e Dashboard de Investimentos

Aplicação experimental para explorar cotações, dividendos, alertas e conversas assistidas por IA sobre o mercado brasileiro. Reúne uma interface React, uma API FastAPI e persistência em SQLite. Não é serviço de assessoria financeira e suas respostas não constituem recomendação de investimento. Disponibilidade, atualização das cotações e qualidade das respostas dependem dos provedores externos.

Este repositório contém o sistema sob uma Arquitetura Híbrida: a API (Backend) desenvolvida em Python com o framework FastAPI gerencia a lógica de negócios e as requisições de Inteligência Artificial, e, simultaneamente, atua como servidor estático para os artefatos compilados do Frontend (desenvolvido em React).

## Tecnologias e Arquitetura

### Backend (Python/FastAPI)
- FastAPI e Uvicorn: Framework web assíncrono de alta performance operando na porta 5173.
- SQLite3: Persistência local de usuários, favoritos, conversas e alertas.
- Google GenAI (Gemini): Motor de Inteligência Artificial utilizado para as consultas do assessor financeiro.
  - A integração contém tentativas entre chaves e modelos. A disponibilidade dos modelos, as cotas e o comportamento real de fallback precisam ser verificados com o provedor; não há garantia de continuidade.
- yfinance: Biblioteca de extração de dados atualizados (cotações, dividendos) a partir do Yahoo Finance.
- Bcrypt e JWT (python-jose): Módulos responsáveis pela segurança, hash de senhas e autenticação de usuários baseada em sessões JWT assinaladas.
- SlowAPI: Limitação de requisições em endpoints configurados. Não substitui proteção de infraestrutura contra DDoS.

### Frontend (React/Vite)
- React.js e Vite: Single Page Application (SPA) com roteamento implementado via react-router-dom.
- Tailwind CSS: Framework de estilização utilitária para construção de interfaces responsivas.
- Integração Unificada: O roteamento relativo elimina a necessidade de configurações complexas de CORS, pois as chamadas à API são tratadas nativamente pelo mesmo servidor.

## Estrutura de Diretórios

O código separa configuração, persistência, serviços e rotas:

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

`SECRET_KEY` é obrigatória: o servidor recusa a chave padrão antiga, valores
curtos ou vazios. Gere uma chave própria com
`python -c "import secrets; print(secrets.token_urlsafe(32))"` e guarde-a somente
no ambiente autorizado. Alterar a chave invalida os tokens anteriores.

A entrega estática restringe arquivos ao diretório `frontend/dist`, inclusive
quando existem links simbólicos. Rotas da SPA continuam usando `index.html`;
APIs desconhecidas e assets ausentes retornam 404.

O banco SQLite é local e não acompanha o repositório. Na primeira inicialização,
`database.connection.init_db()` cria o arquivo definido por `DB_PATH` e as tabelas
vazias; não há contas, senhas, conversas ou favoritos pré-carregados. Cadastre uma
nova conta pela interface. Use um caminho gravável cujo diretório já exista.

Não versione bancos, seus arquivos de transação (`-wal`, `-shm`, `-journal`) ou
cópias com dados reais. A remoção da versão atual não remove cópias de commits
antigos. Esta alteração não apaga bancos de instalações existentes.

Para verificar a inicialização limpa e os fluxos locais com dados sintéticos:

```bash
python -m unittest discover -s tests -v
```

Os testes usam bancos temporários, não acessam o banco configurado da instalação
e não chamam serviços externos. O teste HTTP requer `httpx` (já listado em
`requirements.txt`).

### 3. Build do Frontend

Caso seja necessário modificar e recompilar a interface do usuário, execute o processo de build do React:

```bash
cd frontend
npm ci
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
## Qualidade e limites da validação

A [CI](.github/workflows/ci.yml) executa as regressões de API, banco vazio, configuração e entrega de arquivos. Para reproduzir em um ambiente Python 3.12 separado:

```bash
python -m pip install -r requirements-test.txt
python -m unittest discover -s tests -v
```

A lista de teste instala apenas os componentes utilizados pelas regressões; não substitui `requirements.txt` para executar o produto. Os testes não validam preços reais, Gemini, agendamento completo, carga ou entrega de alertas. Não há certificação OWASP ou evidência de alta disponibilidade.

`frontend/node_modules/` e `frontend/dist/` são gerados por instalação e build. Devem ser reconstruídos, sem versionamento. A limpeza da branch não reescreve o histórico nem reduz automaticamente o tamanho dos clones antigos.
