# API Documentation - Controle TED

## Base URL
`http://localhost:5000/api`

## Autenticação
Todos os endpoints (exceto registro e login) requerem token JWT no header:
```
Authorization: Bearer {token}
```

---

## 🔐 Autenticação

### 1. Registrar Novo Usuário
**POST** `/auth/register`

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123",
  "name": "João Silva"
}
```

**Response (201):**
```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "João Silva",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2. Fazer Login
**POST** `/auth/login`

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "João Silva",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 👤 Usuários

### 1. Obter Perfil do Usuário Logado
**GET** `/user/profile`

**Headers:** Requer autenticação

**Response (200):**
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "name": "João Silva",
  "role": "user",
  "active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 2. Listar Todos os Usuários (Admin Only)
**GET** `/user/all`

**Headers:** Requer autenticação + role admin

**Response (200):**
```json
[
  {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin",
    "active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### 3. Atualizar Usuário
**PUT** `/user/:id`

**Headers:** Requer autenticação

**Request:**
```json
{
  "name": "João Silva Atualizado",
  "email": "novo@example.com"
}
```

**Response (200):** Usuário atualizado

---

## 📋 TEDs

### 1. Listar Todos os TEDs
**GET** `/ted?limit=50&offset=0`

**Headers:** Requer autenticação

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Deslocamento para paginação (padrão: 0)

**Response (200):**
```json
[
  {
    "id": 1,
    "number": "TED-2024-001",
    "title": "Reforma do Prédio A",
    "description": "Reforma completa da estrutura...",
    "status": "EXECUÇÃO",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "total_budget": 100000.00,
    "total_spent": 45000.00,
    "physical_progress_percentage": 45.5,
    "financial_progress_percentage": 45.0,
    "responsible_user_id": 2,
    "created_by": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T15:45:00Z"
  }
]
```

### 2. Obter Detalhes de um TED
**GET** `/ted/:id`

**Headers:** Requer autenticação

**Response (200):**
```json
{
  "id": 1,
  "number": "TED-2024-001",
  "title": "Reforma do Prédio A",
  "description": "Reforma completa da estrutura...",
  "status": "EXECUÇÃO",
  "total_budget": 100000.00,
  "total_spent": 45000.00,
  "physical_progress_percentage": 45.5,
  "financial_progress_percentage": 45.0,
  "physical_milestones": [
    {
      "id": 1,
      "ted_id": 1,
      "description": "Aprovação de projetos",
      "target_percentage": 10,
      "actual_percentage": 10,
      "planned_date": "2024-01-20",
      "completion_date": "2024-01-18",
      "status": "CONCLUÍDO",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "financial_items": [
    {
      "id": 1,
      "ted_id": 1,
      "description": "Compra de materiais",
      "planned_amount": 30000.00,
      "spent_amount": 28500.00,
      "payment_date": "2024-02-15",
      "status": "PAGO",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 3. Criar Novo TED
**POST** `/ted`

**Headers:** Requer autenticação

**Request:**
```json
{
  "number": "TED-2024-001",
  "title": "Reforma do Prédio A",
  "description": "Reforma completa da estrutura",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "total_budget": 100000.00,
  "responsible_user_id": 2
}
```

**Response (201):** TED criado

### 4. Atualizar TED
**PUT** `/ted/:id`

**Headers:** Requer autenticação

**Request:**
```json
{
  "status": "CONCLUÍDO",
  "physical_progress_percentage": 100,
  "financial_progress_percentage": 95,
  "total_spent": 95000.00
}
```

**Response (200):** TED atualizado

### 5. Deletar TED
**DELETE** `/ted/:id`

**Headers:** Requer autenticação

**Response (200):**
```json
{
  "message": "TED deletado com sucesso"
}
```

---

## 📊 Marcos Físicos

### 1. Adicionar Marco Físico
**POST** `/ted/:id/physical-milestone`

**Headers:** Requer autenticação

**Request:**
```json
{
  "description": "Aprovação de projetos",
  "target_percentage": 10,
  "planned_date": "2024-01-20"
}
```

**Response (201):**
```json
{
  "id": 1,
  "ted_id": 1,
  "description": "Aprovação de projetos",
  "target_percentage": 10,
  "actual_percentage": 0,
  "planned_date": "2024-01-20",
  "completion_date": null,
  "status": "PENDENTE",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 2. Atualizar Marco Físico
**PUT** `/ted/:id/physical-milestone/:milestoneId`

**Headers:** Requer autenticação

**Request:**
```json
{
  "actual_percentage": 10,
  "completion_date": "2024-01-18",
  "status": "CONCLUÍDO"
}
```

**Response (200):** Marco atualizado

---

## 💰 Itens Financeiros

### 1. Adicionar Item Financeiro
**POST** `/ted/:id/financial-item`

**Headers:** Requer autenticação

**Request:**
```json
{
  "description": "Compra de materiais",
  "planned_amount": 30000.00,
  "payment_date": "2024-02-15"
}
```

**Response (201):**
```json
{
  "id": 1,
  "ted_id": 1,
  "description": "Compra de materiais",
  "planned_amount": 30000.00,
  "spent_amount": 0,
  "payment_date": "2024-02-15",
  "status": "PLANEJADO",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 2. Atualizar Item Financeiro
**PUT** `/ted/:id/financial-item/:itemId`

**Headers:** Requer autenticação

**Request:**
```json
{
  "spent_amount": 28500.00,
  "payment_date": "2024-02-10",
  "status": "PAGO"
}
```

**Response (200):** Item atualizado

---

## 🔍 Health Check

### Verificar Status do Servidor
**GET** `/health`

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Códigos de Resposta

| Código | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Sem autenticação |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 500 | Server Error - Erro no servidor |

---

## 📌 Status Possíveis

### TEDs
- `PLANEJAMENTO` - Em fase de planejamento
- `EXECUÇÃO` - Em execução
- `CONCLUÍDO` - Finalizado
- `SUSPENSO` - Suspenso

### Marcos Físicos
- `PENDENTE` - Aguardando início
- `EM_PROGRESSO` - Em andamento
- `CONCLUÍDO` - Finalizado
- `ATRASADO` - Em atraso

### Itens Financeiros
- `PLANEJADO` - Previsto
- `PAGO` - Já pago
- `ATRASO` - Em atraso

---

Última atualização: Janeiro 2024
