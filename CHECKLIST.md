# ✅ Checklist de Início Rápido - Controle TED

## Pré-Instalação
- [ ] Node.js 16+ instalado (`node --version`)
- [ ] PostgreSQL instalado e rodando
- [ ] Git instalado (opcional)
- [ ] Acesso ao terminal/PowerShell

## Instalação do Banco de Dados
- [ ] Abrir pgAdmin ou psql
- [ ] Executar: `CREATE DATABASE ted_controle;`
- [ ] Verificar que o banco foi criado

## Setup do Backend
- [ ] Navegar para: `cd backend`
- [ ] Executar: `npm install`
- [ ] Criar arquivo `.env` a partir de `.env.example`
- [ ] Editar `.env` com credenciais PostgreSQL
- [ ] Testar: `npm run dev`
- [ ] Verificar mensagem: "🚀 Servidor rodando na porta 5000"
- [ ] Verificar: "✅ Banco de dados inicializado com sucesso!"

## Setup do Frontend
- [ ] Navegar para: `cd frontend`
- [ ] Executar: `npm install`
- [ ] Testar: `npm run dev`
- [ ] Abrir: `http://localhost:3000` no navegador

## Teste de Funcionalidade
- [ ] Acessar página de login
- [ ] Clicar em "Cadastre-se"
- [ ] Preencher nome, email e senha
- [ ] Clicar "Cadastrar"
- [ ] Ser redirecionado para Dashboard
- [ ] Clicar "Novo TED"
- [ ] Criar um TED de teste
- [ ] Clicar "Detalhes" no TED criado
- [ ] Adicionar um marco físico
- [ ] Adicionar um item financeiro
- [ ] Visualizar gráficos de progresso
- [ ] Clicar "Sair" no topo direito
- [ ] Ser redirecionado para login

## Verificações de Segurança
- [ ] Backend rodando apenas em localhost (seguro)
- [ ] CORS configurado para apenas frontend
- [ ] JWT requerido para endpoints protegidos
- [ ] Senhas armazenadas com hash bcrypt
- [ ] Não há dados sensíveis no `.env.example`

## Otimizações Futuras
- [ ] Instalar VS Code extensions para TypeScript
- [ ] Instalar Prettier para formatação
- [ ] Instalar ESLint para linting
- [ ] Configurar pre-commit hooks

## Documentação
- [ ] Ler `README.md`
- [ ] Ler `docs/INSTALLATION.md`
- [ ] Ler `docs/API.md`
- [ ] Ler `docs/USER_GUIDE.md`
- [ ] Ler `PROJECT_SUMMARY.md`

## Deployment (Futuro)
- [ ] Escolher provider (Heroku, Vercel, AWS, etc)
- [ ] Preparar variáveis de produção
- [ ] Configurar banco de dados remoto
- [ ] Fazer build do frontend: `npm run build`
- [ ] Deploy do backend
- [ ] Deploy do frontend
- [ ] Configurar domínio

## Manutenção
- [ ] Fazer backup do banco regularmente
- [ ] Monitorar logs do servidor
- [ ] Atualizar dependências mensalmente
- [ ] Testar features após atualizações
- [ ] Manter documentação atualizada

## Troubleshooting
Caso encontre problemas:

### Erro: "ECONNREFUSED"
```bash
# Verificar se PostgreSQL está rodando
# Windows: Services → PostgreSQL
# Mac: brew services list
# Linux: sudo systemctl status postgresql
```

### Erro: "Port 5000 already in use"
```bash
# Editar backend/.env e mudar PORT=5001
```

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
npm install

# Limpar cache
npm cache clean --force
npm install
```

### Frontend não conecta com backend
```bash
# Verificar se backend está rodando em http://localhost:5000
# Verificar CORS_ORIGIN em backend/.env
```

---

## 🎯 Meta do Projeto
✅ Sistema funcional para controle de TEDs
✅ Autenticação segura
✅ Dashboard intuitivo
✅ Acompanhamento físico e financeiro
✅ Documentação completa

---

## 📞 Próximos Passos Recomendados

### Semana 1
- [ ] Testar todas as funcionalidades
- [ ] Criar casos de teste
- [ ] Documentar customizações

### Semana 2
- [ ] Integrar com seus sistemas
- [ ] Treinar usuários
- [ ] Coletar feedback

### Semana 3-4
- [ ] Implementar features solicitadas
- [ ] Otimizar performance
- [ ] Preparar para produção

---

**Data de Conclusão do Setup:** _________________

**Responsável:** _________________

**Notas Adicionais:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

---

Bom trabalho! 🚀
