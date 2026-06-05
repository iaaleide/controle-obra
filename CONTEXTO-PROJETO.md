# Controle Obra — Contexto do Projeto

Documento de handoff para retomar o desenvolvimento em uma nova janela do Cursor (Windows).

---

## O que é

Sistema web de controle de presença de funcionários em obras de construção.

Funcionalidades principais:

- Cadastro de **obras** e **funcionários** (many-to-many: um funcionário em várias obras)
- Registro e **alteração de presença** (ADMIN/MESTRE) com histórico de auditoria
- **Relatórios** semanais: PDF, e-mail e WhatsApp
- **Usuários** com perfis ADMIN, MESTRE e VISITANTE
- **Visitantes** só veem/exportam relatórios das obras liberadas para eles

---

## Links e acesso

| Recurso | URL / caminho |
|---------|---------------|
| Pasta local | `C:\Users\DellVostro\projects\controle-obra` |
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
| PDF | jsPDF + jspdf-autotable + fonte DejaVu embutida |
| E-mail | Nodemailer |

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
| **Local** (`.env`) | `db.uqfkczlgfzjfrglfweqw.supabase.co:5432` | `DATABASE_URL` e `DIRECT_URL` |
| **Vercel** (`DATABASE_URL`) | `aws-1-sa-east-1.pooler.supabase.com:6543` | Pooler **aws-1** (não aws-0) |

---

## Como rodar localmente

```powershell
cd C:\Users\DellVostro\projects\controle-obra
npm install
npm run db:push
npm run dev
```

App em http://localhost:3000. Login: `atomica` / `atomica`.

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build produção |
| `npm run db:push` | Aplica schema Prisma |
| `npm run db:seed` | Seed (usuário atomica) |
| `npx vercel --prod --yes` | Deploy produção |

---

## Modelos Prisma (principais)

```
Usuario          # login, senhaHash, nome, email?, telefone?, perfil, ativo
Obra             # nome, endereco, descricao, ativa
Funcionario      # nome, cargo, telefone, ativo
FuncionarioObra  # funcionarioId + obraId (many-to-many)
UsuarioObra      # usuarioId + obraId — obras liberadas para VISITANTE
Presenca         # funcionarioId + data (unique), obraId, presente, observacao
PresencaHistorico # auditoria CRIACAO/ALTERACAO
```

---

## Permissões (`src/lib/permissions.ts`)

| Perfil | Pode fazer |
|--------|------------|
| **ADMIN** | Tudo: usuários, obras, funcionários, presença, relatórios, limpar registros, alocar obras a visitantes |
| **MESTRE** | Cadastrar funcionários/obras/presença; alterar presença; relatórios; alocar obras a visitantes; minha conta |
| **VISITANTE** | Só **relatórios** das obras liberadas: carregar, PDF, e-mail, WhatsApp; minha conta. **Não** marca presença, **não** vê checkbox “quem não veio” |

### Visitante — regras importantes

- Menu: só **Início**, **Relatórios** e **Minha conta**
- Obras filtradas por `UsuarioObra` (API + tela)
- Relatório sempre só com quem teve ≥ 1 dia (`resolverIncluirSemPresenca` força `false`)
- Acesso a `/dashboard/presenca` redireciona para relatórios

### Liberar obras ao visitante

- **ADMIN:** `/dashboard/usuarios` (criar/editar visitante) ou `/dashboard/visitantes`
- **MESTRE:** `/dashboard/visitantes`
- API: `PUT /api/usuarios/[id]/obras` com `{ obraIds: [...] }`

---

## Funcionalidades por área

### Presença (`/dashboard/presenca`) — ADMIN e MESTRE

- Fluxo 4 passos: funcionário → obra + data → alocar → marcar/alterar
- Histórico de alterações na tela
- **ADMIN:** card **Limpar registros** no final (com confirmação; por obra ou todas)
- API: `DELETE /api/presencas/limpar`

### Relatórios (`/dashboard/relatorios`)

- Checkbox “Incluir quem não veio” — **só ADMIN e MESTRE**
- Rodapé: `Desenvolvido por Atômica Engenharia®` (`RODAPE_RELATORIO` em `src/lib/pdf.ts`)
- PDF gerado em `src/lib/pdf-gerar.ts` (fonte DejaVu em `src/lib/pdf-font-dejavu.ts` — não depender de `node_modules` na Vercel)
- E-mail/WhatsApp com contatos pré-preenchidos de **Minha conta**
- Ícone WhatsApp: `src/components/icons/WhatsAppIcon.tsx`

### Usuários (`/dashboard/usuarios`) — só ADMIN

- CRUD, soft delete, reativar
- Campos **e-mail** e **WhatsApp** no cadastro/edição
- Visitante: marcar **obras liberadas**

### Minha conta (`/dashboard/alterar-senha`)

- Todos os perfis: salvar e-mail e WhatsApp (`PATCH /api/auth/contato`)
- ADMIN/MESTRE: alterar senha

---

## Arquivos importantes

```
prisma/schema.prisma
src/lib/permissions.ts
src/lib/acesso-obra.ts          # usuarioPodeAcessarObra, sincronizarObrasVisitante
src/lib/relatorio.ts            # resolverIncluirSemPresenca
src/lib/pdf.ts                  # tipos, RODAPE_RELATORIO, texto WhatsApp
src/lib/pdf-gerar.ts            # geração PDF (server-only)
src/lib/pdf-font-dejavu.ts      # fonte base64 (gerar: node scripts/embed-pdf-font.mjs)
src/lib/usuario-contato.ts      # validação email/telefone
src/lib/telefone.ts
src/middleware.ts
```

### Páginas dashboard

```
/dashboard                  # cards por permissão
/dashboard/presenca         # ADMIN, MESTRE
/dashboard/funcionarios     # ADMIN, MESTRE
/dashboard/obras            # ADMIN, MESTRE
/dashboard/relatorios       # todos (visitante: obras filtradas)
/dashboard/usuarios         # ADMIN
/dashboard/visitantes       # ADMIN, MESTRE — alocar obras a visitantes
/dashboard/alterar-senha    # Minha conta (todos)
```

### APIs principais

```
/api/auth/me, /api/auth/contato
/api/obras                  # GET filtra por UsuarioObra se VISITANTE
/api/presencas, /api/presencas/limpar
/api/relatorios/semanal, /pdf, /enviar  # checam acesso à obra
/api/usuarios, /api/usuarios/visitantes, /api/usuarios/[id]/obras
```

---

## Problemas resolvidos

| Problema | Solução |
|----------|---------|
| Login Vercel / `tenant not found` | Pooler `aws-1-sa-east-1`, `findFirst` em auth |
| PDF erro 500 (ENOENT fonte) | Fonte DejaVu embutida em `pdf-font-dejavu.ts` |
| PDF rodapé `(R)` / página em branco | `Atômica Engenharia®` + margens autoTable corrigidas |
| Visitante vendo todas as obras | Modelo `UsuarioObra` + filtro API/UI |
| Contatos atomica não salvavam | Validação telefone + edição em usuários/minha conta |

---

## Deploy produção

```powershell
cd C:\Users\DellVostro\projects\controle-obra
npm run db:push
git add -A
git commit -m "sua mensagem"
git push origin main
npx vercel --prod --yes
```

---

## Para retomar numa nova janela

1. Abrir `C:\Users\DellVostro\projects\controle-obra` no Cursor
2. Ler este arquivo (`CONTEXTO-PROJETO.md`)
3. `.env` a partir de `.env.example` se necessário
4. `npm install` → `npm run db:push` → `npm run dev`
5. Login: `atomica` / `atomica`

---

## Possíveis próximos passos

- [ ] Filtro/reativar funcionários inativos (`/dashboard/funcionarios`)
- [ ] Testes de API por perfil
- [ ] UX mobile na tela de presença

---

*Última atualização: junho/2026 — visitante restrito, contatos, PDF Atômica®, limpar registros (ADMIN).*
