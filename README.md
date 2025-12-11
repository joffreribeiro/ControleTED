# Controle TED - Sistema de Execução Descentralizada

Sistema web completo para controlar a execução física e financeira de Termos de Execução Descentralizada (TED).

## 🏗️ Arquitetura do Projeto

```
Controle-TED/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── controllers/     # Lógica de negócios
│   │   ├── models/          # Modelos de dados
│   │   ├── routes/          # Rotas da API
│   │   ├── middleware/      # Middlewares (autenticação, etc)
│   │   ├── database/        # Inicialização do BD
│   │   ├── config/          # Configurações
│   │   └── index.ts         # Servidor principal
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                # Aplicação React
│   ├── src/
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── services/        # Serviços de API
│   │   ├── styles/          # Estilos globais
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── docs/                    # Documentação
```

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 16+ 
- PostgreSQL 12+
- npm ou yarn

### Instalação

#### 1. Backend

```bash
cd backend
npm install
```

Criar arquivo `.env` baseado em `.env.example`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ted_controle
PORT=5000
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
CORS_ORIGIN=http://localhost:3000
```

#### 2. Frontend

```bash
cd frontend
npm install
```

### Executando a Aplicação

#### Backend
```bash
cd backend
npm run dev
```

O servidor estará disponível em `http://localhost:5000`

#### Frontend
```bash
cd frontend
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 📊 Funcionalidades Principais

### Autenticação
- ✅ Registro de novos usuários
- ✅ Login com JWT
- ✅ Gestão de perfis de usuário
- ✅ Roles (admin, gestor, user)

### Gestão de TEDs
- ✅ Criar, ler, atualizar e deletar TEDs
- ✅ Status do TED (Planejamento, Execução, Concluído, Suspenso)
- ✅ Orçamento total e gasto

### Execução Física
- ✅ Criar marcos físicos
- ✅ Acompanhar progresso em percentual
- ✅ Data de conclusão planejada vs real
- ✅ Visualização em gráficos

### Execução Financeira
- ✅ Criar itens de despesa
- ✅ Rastreamento de gastos vs. planejado
- ✅ Status de pagamento
- ✅ Dados financeiros em tempo real

### Relatórios e Visualizações
- ✅ Dashboard com resumo de TEDs
- ✅ Gráficos de progresso físico e financeiro
- ✅ Listagem de marcos e itens financeiros
- ✅ Filtros e busca

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/user/profile` - Obter perfil do usuário

### TEDs
- `GET /api/ted` - Listar todos os TEDs
- `GET /api/ted/:id` - Obter detalhes de um TED
- `POST /api/ted` - Criar novo TED
- `PUT /api/ted/:id` - Atualizar TED
- `DELETE /api/ted/:id` - Deletar TED

### Marcos Físicos
- `POST /api/ted/:id/physical-milestone` - Adicionar marco físico
- `PUT /api/ted/:id/physical-milestone/:milestoneId` - Atualizar marco

### Itens Financeiros
- `POST /api/ted/:id/financial-item` - Adicionar item financeiro
- `PUT /api/ted/:id/financial-item/:itemId` - Atualizar item

## 🗄️ Banco de Dados

### Tabelas Principais

**users**
- id (PK)
- email (UNIQUE)
- password
- name
- role (admin, gestor, user)
- active

**teds**
- id (PK)
- number (UNIQUE)
- title
- description
- status
- start_date, end_date
- total_budget, total_spent
- physical_progress_percentage
- financial_progress_percentage
- responsible_user_id (FK)
- created_by (FK)

**physical_milestones**
- id (PK)
- ted_id (FK)
- description
- target_percentage, actual_percentage
- planned_date, completion_date
- status

**financial_items**
- id (PK)
- ted_id (FK)
- description
- planned_amount, spent_amount
- payment_date
- status

**activities**
- id (PK)
- ted_id (FK)
- user_id (FK)
- type
- description

## 🎨 Tecnologias Utilizadas

### Backend
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **React Router** - Roteamento
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos
- **Axios** - Cliente HTTP
- **Vite** - Build tool

## 📝 Próximos Passos

- [ ] Implementar modelos de exportação (PDF, Excel)
- [ ] Adicionar notificações por email
- [ ] Criar sistema de comentários/atividades
- [ ] Implementar upload de documentos
- [ ] Adicionar permissões granulares
- [ ] Sistema de aprovações
- [ ] Auditoria de mudanças
- [ ] Backup automático

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para simplificar o controle de Termos de Execução Descentralizada**
