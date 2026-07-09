
# System Architecture Rules

## Port and Access Unified
- O sistema Radar B3 agora foi **UNIFICADO** (Backend + Frontend rodam no mesmo servidor FastAPI).
- A aplicação inteira deve ser acessada via porta **5173** (http://localhost:5173).
- A porta **8001 não existe mais**. NUNCA dê a instrução ao usuário de acessar o Backend, Swagger, ou API na porta 8001.
- Se solicitado os links de acesso do sistema, mostre apenas o link principal: http://localhost:5173.
