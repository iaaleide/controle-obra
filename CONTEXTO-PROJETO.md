# Controle Obra — Contexto do Projeto

Documento de handoff para retomar o desenvolvimento em uma nova janela do Cursor (Windows).

---

## O que é

Sistema web de controle de presença de funcionários em obras de construção.

Funcionalidades principais:

- Cadastro de **obras** e **funcionários** (um funcionário pode estar alocado em várias obras)
- Registro e **alteração de presença** por funcionário, obra e data (com histórico arquivado)
- **Relatórios** semanais com exportação PDF e envio por **WhatsApp**

---

## Links e acesso

| Recurso | URL / caminho |
|---------|---------------|
| Pasta local | `C:\Users\DellVostro\Projects\controle-obra` |
| GitHub | https://github.com/iaaleide/controle-obra |
| Produção (Vercel) | https://controle-obra-khaki.vercel.app |
| Login padrão | `atomica` / `atomica` (perfil **ADMIN**) |

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| ORM | Prisma |
| Banco | PostgreSQL (Supabase) |
| Auth | JWT + Supabase SSR (`@supabase/ssr`) |
| UI | React 19, Tailwind CSS 4 |
| Deploy | Vercel |
| PDF | jsPDF + jspdf-autotable |
| E-mail | Nodemailer (recuperação de senha) |

---

## Supabase / banco

| Item | Valor |
|------|-------|
| Projeto (ref) | `uqfkczlgfzjfrglfweqw` |
| URL Supabase | https://uqfkczlgfzjfrglfweqw.supabase.co |
| Senha do banco | `atomicaadm2402` — **NÃO commitar** |
| Login painel Supabase | `ia.aleide@gmail.com` |

### Conexões

| Ambiente | Host / porta | Uso |
|----------|--------------|-----|
| **Local** (`.env`) | `db.uqfkczlgfzjfrglfweqw.supabase.co:5432` | Conexão direta (`DATABASE_URL` e `DIRECT_URL`) |
| **Vercel** (`DATABASE_URL`) | `aws-1-sa-east-1.pooler.supabase.com:6543` | Transaction pooler — usar **aws-1**, **NÃO aws-0** |

### Arquivos de referência

- `.env.example` — template com todas as variáveis necessárias
- `scripts/push-env-vercel.mjs` — sincroniza variáveis do `.env` local para a Vercel
- `SUPABASE.md` — documentação adicional do Supabase
- `supabase/schema.sql` — schema SQL de referência
- `supabase/migrations/presenca-historico.sql` — migração manual da tabela de histórico

---

## Como rodar localmente

```powershell
cd C:\Users\DellVostro\Projects\controle-obra
npm install
npm run db:setup
npm run dev
```

O app sobe em http://localhost:3000.

### Scripts úteis (`package.json`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (gera Prisma + Next) |
| `npm run db:setup` | `prisma db push` + seed (`prisma/seed.ts`) |
| `npm run db:push` | Aplica schema Prisma ao banco |
| `npm run db:seed` | Popula dados iniciais (usuário `atomica`, etc.) |
| `npm run db:status` | Inspeciona schema atual do banco |

---

## Funcionalidades principais

### 1. Funcionários em várias obras

- Modelo `FuncionarioObra` (many-to-many) em `prisma/schema.prisma`
- Tela: `/dashboard/funcionarios`
- API: `POST /api/funcionarios/[id]/alocar` para vincular funcionário a obra

### 2. Presença em 4 passos

- Tela: `/dashboard/presenca`
- Fluxo: selecionar funcionário → escolher obra + data → alocar à obra se necessário → registrar ou **alterar** presença
- API: `GET/POST /api/presencas`
- Perfis **ADMIN** e **MESTRE** podem registrar e alterar dias já marcados
- Cada criação ou alteração gera registro em `PresencaHistorico` (quem fez, quando, valores anteriores)
- Consulta do histórico na própria tela de presença e via `GET /api/presencas/historico`

### 3. Telefone +55 e WhatsApp

- Normalização e formatação: `src/lib/telefone.ts`
- Componente de input: `src/components/ui/TelefoneBrasilInput.tsx`
- Relatórios com link WhatsApp: `src/lib/relatorio.ts`, `src/app/api/relatorios/enviar/route.ts`

### 4. Histórico de presença (auditoria)

- Modelo `PresencaHistorico` em `prisma/schema.prisma` (ações `CRIACAO` e `ALTERACAO`)
- Lógica: `src/lib/presenca-historico.ts`
- API: `GET /api/presencas/historico?presencaId=...` ou `?funcionarioId=...&data=...`
- Visível para quem tem `ver_presenca` (ADMIN, MESTRE e VISITANTE)

### 5. Exclusão soft (somente ADMIN)

- Campo `ativo = false` em `Funcionario` (não remove do banco)
- Confirmação na UI antes de desativar
- Histórico de presença preservado nos relatórios
- Apenas perfil **ADMIN** pode desativar

---

## Permissões

Definidas em `src/lib/permissions.ts`:

| Perfil | Pode fazer |
|--------|------------|
| **ADMIN** | Tudo: cadastrar, editar, excluir (soft), gerenciar usuários, relatórios |
| **MESTRE** | Cadastrar funcionários, obras e presença; **alterar** presença já registrada; **não** edita funcionários/obras nem exclui |
| **VISITANTE** | Apenas visualizar dashboard, listas e relatórios |

Middleware de proteção de rotas: `src/middleware.ts`.

---

## Arquivos importantes

### Schema e dados

```
prisma/schema.prisma      # Modelos: Usuario, Obra, Funcionario, FuncionarioObra, Presenca, PresencaHistorico
prisma/seed.ts            # Dados iniciais (usuário atomica, obras de exemplo)
```

### Autenticação e permissões

```
src/lib/auth.ts           # Login JWT, sessão, findFirst (não findUnique com ativo)
src/lib/permissions.ts    # Matriz de permissões, labels e descrições por perfil
src/middleware.ts         # Proteção de rotas /dashboard e /api
src/utils/supabase/       # client.ts, server.ts, middleware.ts (Supabase SSR)
```

### Domínio

```
src/lib/telefone.ts           # Formatação telefone Brasil (+55)
src/lib/presenca-historico.ts # Arquivamento de criação/alteração de presença
src/lib/relatorio.ts          # Geração de relatório semanal + link WhatsApp
src/lib/pdf.ts                # Exportação PDF
src/lib/prisma.ts             # Cliente Prisma singleton
```

### Páginas (dashboard)

```
src/app/dashboard/page.tsx              # Home do dashboard
src/app/dashboard/funcionarios/page.tsx # CRUD funcionários + alocação obras
src/app/dashboard/obras/page.tsx        # CRUD obras
src/app/dashboard/presenca/page.tsx     # Fluxo 4 passos + histórico de alterações
src/app/dashboard/relatorios/page.tsx   # Relatórios + PDF + WhatsApp
src/app/dashboard/usuarios/page.tsx     # Gerenciar usuários (ADMIN)
src/app/dashboard/alterar-senha/page.tsx
src/app/login/page.tsx
```

### API routes

```
src/app/api/auth/           # login, logout, me, alterar-senha, recuperar-senha
src/app/api/funcionarios/   # CRUD + [id]/alocar
src/app/api/obras/          # CRUD obras
src/app/api/presencas/      # Listar, registrar e alterar presença
src/app/api/presencas/historico/  # Consultar histórico arquivado
src/app/api/relatorios/     # semanal, pdf, enviar (WhatsApp)
src/app/api/usuarios/       # Gerenciar usuários
```

### Scripts e deploy

```
scripts/push-env-vercel.mjs           # Sync .env → Vercel
scripts/migrate-funcionario-obras.mjs # Migração many-to-many
scripts/sync-vercel-env.ps1           # Alternativa PowerShell
DEPLOY-VERCEL.md                      # Guia de deploy
vercel.json
.env.example
```

### Componentes UI

```
src/components/ui/TelefoneBrasilInput.tsx
src/components/ui/Button.tsx, Input.tsx, Card.tsx, Badge.tsx
src/components/layout/AppShell.tsx, PerfilBanner.tsx
```

---

## Git — estado atual

- Branch: `main`, sincronizada com `origin/main`
- Deploy de produção: **feito**

### Commits recentes relevantes

| Hash | Descrição |
|------|-----------|
| `58a5ad2` | Melhorar presença, telefone Brasil (+55) e fluxo WhatsApp |
| `69cb09f` | Permitir exclusão soft de funcionários apenas para ADMIN, preservando histórico |
| *(pendente)* | MESTRE pode alterar presença; histórico arquivado em `PresencaHistorico` |

---

## Problemas resolvidos

| Problema | Causa | Solução |
|----------|-------|---------|
| Erro interno no login (Vercel) | Pooler incorreto / conexão IPv4 | Usar pooler `aws-1-sa-east-1.pooler.supabase.com:6543` |
| `tenant not found` | Host `aws-0` em vez de `aws-1` | Trocar para **aws-1-sa-east-1** no `DATABASE_URL` da Vercel |
| Falha de autenticação com `findUnique` | Filtro `ativo: true` em `findUnique` não suportado como esperado | Trocar para `findFirst` em `src/lib/auth.ts` |

---

## Deploy produção

```powershell
cd C:\Users\DellVostro\Projects\controle-obra
npm run db:push
node scripts/push-env-vercel.mjs
npx vercel --prod --yes
```

Confirme que `DATABASE_URL` na Vercel aponta para `aws-1-sa-east-1.pooler.supabase.com:6543`.

Após mudanças no `schema.prisma` (ex.: `PresencaHistorico`), rode `npm run db:push` **antes** do deploy para criar/atualizar tabelas no Supabase.

---

## Para retomar numa nova janela

1. Abrir pasta no Cursor: `C:\Users\DellVostro\Projects\controle-obra`
2. Verificar se `.env` existe (copiar de `.env.example` se necessário) e preencher:
   - `DATABASE_URL` / `DIRECT_URL` com senha `atomicaadm2402`
   - `JWT_SECRET`, chaves Supabase, SMTP (se for testar e-mail)
3. Rodar `npm install` (se `node_modules` não existir)
4. Rodar `npm run dev` e acessar http://localhost:3000
5. Login: `atomica` / `atomica`
6. Ler este arquivo e, se necessário, `PROXIMOS-PASSOS.md` / `DEPLOY-VERCEL.md`

---

## Possíveis próximos passos

- [ ] Filtro de funcionários inativos na listagem (`/dashboard/funcionarios`)
- [ ] Reativar funcionário desativado (toggle `ativo = true`, só ADMIN)
- [ ] Testes de API para validar permissões por perfil (MESTRE altera presença, não edita funcionário/obra)
- [ ] Melhorar UX mobile na tela de presença (`/dashboard/presenca`)

---

*Última atualização: junho/2026 — branch `main`, deploy Vercel ativo.*
