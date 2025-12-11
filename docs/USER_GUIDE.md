# Guia de Uso - Controle TED

## 📱 Interface do Sistema

### Fluxo Geral do Usuário

```
Login/Registro
    ↓
Dashboard (Listagem de TEDs)
    ↓
Criar/Editar TED
    ↓
Gerenciar Execução (Física + Financeira)
    ↓
Acompanhar Progresso e Gerar Relatórios
```

---

## 🔑 Login e Registro

### Primeiro Acesso
1. Acesse **http://localhost:3000**
2. Clique em **"Cadastre-se"**
3. Preencha os campos:
   - **Nome**: Seu nome completo
   - **Email**: Um email válido
   - **Senha**: Mínimo 6 caracteres
4. Clique em **"Cadastrar"**
5. Você será automaticamente logado

### Acessar Conta Existente
1. Na página de login, insira suas credenciais
2. Clique em **"Entrar"**

---

## 📋 Gerenciando TEDs

### Criar um Novo TED

1. No **Dashboard**, clique em **"+ Novo TED"**
2. Preencha os campos:
   - **Número do TED**: Identificador único (ex: TED-2024-001)
   - **Título**: Nome descritivo
   - **Descrição**: Detalhes do projeto
   - **Data de Início**: Quando começa
   - **Data de Término**: Quando deve acabar
   - **Orçamento Total**: Valor em R$
3. Clique em **"Criar TED"**

### Visualizar Detalhes de um TED

1. No **Dashboard**, localize o TED desejado
2. Clique em **"Detalhes"**
3. Você verá:
   - Informações gerais
   - Gráficos de progresso
   - Marcos físicos
   - Itens financeiros

### Editar um TED

1. Acesse os detalhes do TED
2. Modifique os campos necessários
3. Clique em **"Salvar"** (quando implementado)

### Deletar um TED

1. No **Dashboard**, clique em **"Deletar"** no TED
2. Confirme a ação
3. O TED será removido do sistema

---

## 📊 Acompanhamento Físico

### Adicionar um Marco Físico

1. Acesse os detalhes de um TED
2. Vá até a aba **"Execução Física"**
3. Clique em **"+ Adicionar Marco"**
4. Preencha:
   - **Descrição**: O que deve ser feito
   - **Meta (%)**: Percentual esperado (ex: 20%)
   - **Data Planejada**: Quando deve terminar
5. Clique em **"Salvar"**

### Atualizar Progresso de um Marco

1. Na aba **"Execução Física"**, localize o marco
2. Clique em **"Editar"**
3. Atualize:
   - **Progresso Real (%)**: Quanto foi feito
   - **Data de Conclusão**: Quando foi finalizado
   - **Status**: PENDENTE → EM_PROGRESSO → CONCLUÍDO
4. Clique em **"Salvar"**

### Entender o Gráfico de Progresso Físico

- **Barra azul**: Representa o percentual de conclusão
- **Texto**: Mostra "(X% completado / Y% esperado)"
- Cores:
  - 🟦 Azul: Progresso normal
  - 🟨 Amarelo: Em atraso
  - 🟩 Verde: Concluído

---

## 💰 Acompanhamento Financeiro

### Adicionar um Item de Despesa

1. Acesse os detalhes de um TED
2. Vá até a aba **"Execução Financeira"**
3. Clique em **"+ Adicionar Item"**
4. Preencha:
   - **Descrição**: O que é a despesa (ex: "Compra de materiais")
   - **Valor Planejado**: Quanto deveria custar
   - **Data de Pagamento**: Quando está previsto
5. Clique em **"Salvar"**

### Registrar um Pagamento

1. Na aba **"Execução Financeira"**, localize o item
2. Clique em **"Editar"**
3. Atualize:
   - **Valor Gasto**: Quanto foi realmente gasto
   - **Data de Pagamento**: Quando foi pago
   - **Status**: PLANEJADO → PAGO
4. Clique em **"Salvar"**

### Entender o Gráfico Financeiro

- **Total do Orçamento**: Soma de todos os itens planejados
- **Total Gasto**: Soma de todos os pagamentos realizados
- **Percentual Financeiro**: (Total Gasto / Total Orçamento) × 100
- Variações:
  - Se gasto > planejado: Item excedeu o orçamento ⚠️
  - Se gasto < planejado: Item está dentro do orçamento ✅

---

## 📈 Dashboard

O dashboard mostra um resumo de todos os TEDs com:

### Cards de TED
Cada TED mostra:
- **Status**: Color-coded (Amarelo=Planejamento, Azul=Execução, Verde=Concluído, Vermelho=Suspenso)
- **Barra de Progresso Físico**: Azul (0-100%)
- **Barra de Progresso Financeiro**: Verde (0-100%)
- **Orçamento Total**: Em R$
- **Gasto até agora**: Em R$

### Filtros (Próximas versões)
- Por Status
- Por Responsável
- Por Data
- Por Orçamento

---

## 🔐 Segurança

### Seu Token JWT
- Armazenado localmente no navegador
- Enviado automaticamente em cada requisição
- Válido por **24 horas**
- Faça logout para remover

### Logout
1. Clique no botão **"Sair"** no topo da página
2. Você será redirecionado para login
3. Seu token será removido

---

## 📊 Interpretando os Dados

### Status de TED

| Status | Significado | O que fazer |
|--------|------------|-----------|
| 🟨 PLANEJAMENTO | Ainda não começou | Confirmar datas e orçamento |
| 🔵 EXECUÇÃO | Em andamento | Atualizar progresso regularmente |
| 🟢 CONCLUÍDO | Finalizado | Revisar relatórios finais |
| 🔴 SUSPENSO | Parado | Investigar motivo e retomar |

### Status de Marcos

| Status | Significado |
|--------|-----------|
| PENDENTE | Aguardando início |
| EM_PROGRESSO | Sendo executado |
| CONCLUÍDO | Finalizado no prazo |
| ATRASADO | Passou da data |

### Status Financeiro

| Status | Significado |
|--------|-----------|
| PLANEJADO | Ainda não foi pago |
| PAGO | Já foi pago |
| ATRASO | Passou da data de pagamento |

---

## 💡 Dicas de Uso

### Melhor Prática 1: Quebrar em Marcos
Divida o TED em marcos menores:
- Cada marco = 10-20% do trabalho
- Facilita acompanhamento
- Motiva a equipe

### Melhor Prática 2: Atualizar Regularmente
- ✅ Atualize marcos toda semana
- ✅ Registre despesas assim que pagarem
- ✅ Comunique atrasos rapidamente

### Melhor Prática 3: Orçamento Realista
- Sempre adicione margem (10-15%)
- Consulte histórico de projetos similares
- Revise conforme o projeto avança

### Melhor Prática 4: Documentar Tudo
- Use descrições claras
- Adicione contexto nos comentários (próxima versão)
- Mantenha datas atualizadas

---

## ❓ Perguntas Frequentes

### P: Posso deletar um TED que já foi iniciado?
**R:** Sim, mas use com cuidado! Todos os dados serão perdidos. Considere marcar como SUSPENSO antes.

### P: Como calcular o percentual físico?
**R:** Divida o total realizado pelo total esperado:
```
% Físico = (Soma dos % dos marcos completados) / (Número total de marcos) × 100
```

### P: Posso mudar o orçamento depois de criado?
**R:** Sim! Acesse os detalhes e edite o campo "Orçamento Total".

### P: Meu TED está com 100% mas com dinheiro sobrando. É normal?
**R:** Sim, é comum! Significa que você economizou. Documente na descrição do TED.

### P: Como saber se estou em atraso?
**R:** Compare a data de hoje com a data planejada. Se passou, você está em atraso.

---

## 🆘 Suporte e Problemas

### Não consigo fazer login
- [ ] Verificar email e senha
- [ ] Limpar cache do navegador
- [ ] Reiniciar o servidor

### Os dados não salvam
- [ ] Verificar conexão com internet
- [ ] Verificar se o backend está rodando
- [ ] Verificar se há espaço em disco

### Gráficos não aparecem
- [ ] Atualizar a página
- [ ] Usar navegador diferente
- [ ] Verificar console do navegador

---

**Última atualização:** Janeiro 2024
**Versão:** 1.0.0
