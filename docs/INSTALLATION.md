# Guia de Instalação - Controle TED

## Pré-requisitos

1. **Node.js** (v16+)
   - Download: https://nodejs.org/
   - Verificar: `node --version`

2. **PostgreSQL** (v12+)
   - Download: https://www.postgresql.org/download/
   - Criar banco de dados: `ted_controle`

3. **Git** (opcional, para versionamento)
   - Download: https://git-scm.com/

## Passo a Passo

### 1. Configurar o Banco de Dados

Abra o PostgreSQL e execute:

```sql
CREATE DATABASE ted_controle;
```

### 2. Instalar Dependências do Backend

```bash
cd backend
npm install
```

### 3. Configurar Variáveis de Ambiente (Backend)

Copie `.env.example` para `.env` e atualize com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres
DB_NAME=ted_controle
PORT=5000
JWT_SECRET=uma_chave_secreta_super_segura_123456
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### 4. Instalar Dependências do Frontend

```bash
cd ../frontend
npm install
```

### 5. Executar a Aplicação

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Você verá:
```
🚀 Servidor rodando na porta 5000
✅ Banco de dados inicializado com sucesso!
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Você verá:
```
VITE v4.4.0  ready in 123 ms

➜  Local:   http://localhost:3000/
```

### 6. Acessar a Aplicação

Abra no navegador: **http://localhost:3000**

## Primeiro Acesso

1. Clique em "Cadastre-se"
2. Preencha seus dados:
   - Nome: Seu nome
   - Email: seu@email.com
   - Senha: Uma senha segura
3. Clique em "Cadastrar"
4. Você será redirecionado para o Dashboard

## Solução de Problemas

### Erro: "connect ECONNREFUSED 127.0.0.1:5432"
- PostgreSQL não está rodando
- Solução: Inicie o serviço PostgreSQL

### Erro: "EADDRINUSE: address already in use :::5000"
- Porta 5000 já está em uso
- Solução: Altere `PORT` no arquivo `.env`

### Erro: "database ted_controle does not exist"
- O banco de dados ainda não foi criado
- Solução: Execute o comando SQL acima

### Erro: "Cannot find module 'typescript'"
- Dependências não instaladas
- Solução: Execute `npm install` nos diretórios backend e frontend

## Build para Produção

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

Os arquivos estarão em `frontend/dist/`

## Próximas Ações

1. ✅ Cadastre um TED
2. ✅ Adicione marcos físicos
3. ✅ Registre gastos financeiros
4. ✅ Acompanhe o progresso em tempo real

Bom uso! 🎉
