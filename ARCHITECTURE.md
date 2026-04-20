# Arquitetura — Controle TED

## Sistema Ativo

| Pasta/Arquivo | Tecnologia | Papel |
|---|---|---|
| `backend/` | TypeScript + Express | API REST (fonte da verdade) |
| `frontend/` | React + Vite + Tailwind | SPA — interface do usuário |
| `dados/ted-sistema.json` | JSON | Armazenamento de dados (fallback de arquivo) |

### Backend (`backend/src/`)
- `config/constants.ts` — Constantes globais: porta, status, defaults
- `config/jwtConfig.ts` — Helpers de JWT (fonte única)
- `config/database.ts` — Pool PostgreSQL
- `database/init.ts` — Inicialização do schema
- `middleware/auth.ts` — Middleware JWT
- `models/` — Queries do banco
- `routes/` — Endpoints REST
- `services/fileStorage.ts` — I/O de arquivo JSON (modo sem banco)
- `validation/tedSchemas.ts` — Validação de input
- `utils/logger.ts` — Logger estruturado
- `types/ted.ts` — Interfaces TypeScript do domínio

### Frontend (`frontend/src/`)
- `constants/tedStatus.ts` — Enums de status (fonte única no frontend)
- `constants/chartColors.ts` — Cores de gráficos (fonte única)
- `pages/` — Telas (Dashboard, Login, CreateTED, TEDDetails)
- `services/` — Chamadas à API

## Arquivos Legados (não usar em produção)

| Arquivo | Descrição |
|---|---|
| `servidor.js` | Protótipo Node.js original — substituído por `backend/` |
| `app.js` | Frontend JS/Firebase antigo — substituído por `frontend/` |
| `firebase-init.js` | Experimento Firebase — não integrado |
| `index.html` (raiz) | Protótipo HTML estático — substituído pelo build React |
| `js/main.js` | JS legado do protótipo |
| `styles.css` | CSS legado do protótipo |

## Variáveis de Ambiente

Ver `.env.example` para a lista completa de variáveis.
