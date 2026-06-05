# Conectar ao Supabase

Conta Supabase: **ia.aleide@gmail.com**

## Passo 1 — Criar o projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login com **ia.aleide@gmail.com**
2. Clique em **New project**
3. Preencha:
   - **Name:** `controle-obra`
   - **Database Password:** crie uma senha forte e **anote** (você vai usar no `.env`)
   - **Region:** escolha a mais próxima (ex: South America — São Paulo)
4. Clique em **Create new project** e aguarde ~2 minutos

## Passo 2 — Copiar as URLs de conexão

1. No painel do projeto, vá em **Project Settings** (ícone de engrenagem)
2. Clique em **Database**
3. Em **Connection string**, selecione **URI**
4. Copie duas strings:

| Variável | Modo no Supabase | Porta |
|----------|------------------|-------|
| `DATABASE_URL` | **Transaction** (pooler) | 6543 |
| `DIRECT_URL` | **Session** ou **Direct** | 5432 |

Substitua `[YOUR-PASSWORD]` pela senha que você criou no passo 1.

## Passo 3 — Criar o arquivo `.env`

Na pasta do projeto, copie o exemplo:

```bash
copy .env.example .env
```

Edite o `.env` e cole as duas URLs do Supabase. Exemplo:

```env
DATABASE_URL="postgresql://postgres.xxxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="uma-chave-secreta-longa-e-aleatoria-aqui"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Passo 4 — Criar as tabelas no banco

### Opção A — Pelo terminal (recomendado)

```bash
npm install
npm run db:setup
```

Isso cria todas as tabelas e o usuário admin inicial (`login: atomica` / `senha: atomica`).

### Opção B — Pelo SQL Editor do Supabase

1. No Supabase, vá em **SQL Editor** → **New query**
2. Cole o conteúdo do arquivo `supabase/schema.sql`
3. Clique em **Run**
4. Depois rode só o seed: `npm run db:seed`

## Passo 5 — Testar

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e entre com:

- **Login:** `atomica`
- **Senha:** `atomica`

## Deploy na Vercel

No painel da Vercel, adicione as mesmas variáveis de ambiente:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` (URL do app na Vercel, ex: `https://controle-obra.vercel.app`)
- `RECOVERY_EMAIL_1` e `RECOVERY_EMAIL_2`
- Variáveis SMTP (se for usar e-mail)

Depois do deploy, rode o seed uma vez (localmente apontando para o banco de produção, ou via `npx prisma db seed`).

## Problemas comuns

| Erro | Solução |
|------|---------|
| `Can't reach database` | Verifique senha e se o projeto Supabase está ativo |
| `prepared statement already exists` | Use `DATABASE_URL` com `?pgbouncer=true` (porta 6543) |
| Tabelas não existem | Rode `npm run db:push` ou execute `supabase/schema.sql` |
