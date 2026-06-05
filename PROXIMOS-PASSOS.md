# Próximos passos — Controle Obra + Supabase

Projeto Supabase: **https://vctdqymehlzxrlterhet.supabase.co**

---

## ✅ Já feito

- Projeto Next.js em `D:\controle-obra`
- Arquivo `.env` criado com as URLs do seu Supabase
- Schema SQL pronto em `supabase/schema.sql`

---

## 🔴 O que VOCÊ precisa fazer agora (3 passos)

### Passo 1 — Colocar a senha do banco no `.env`

1. Abra o arquivo `D:\controle-obra\.env`
2. Substitua **todas** as ocorrências de `COLOQUE_SUA_SENHA_AQUI` pela senha do banco

> **Onde achar a senha?** É a que você definiu ao criar o projeto no Supabase.  
> Se esqueceu: Supabase → **Project Settings** → **Database** → **Reset database password**

---

### Passo 2 — Instalar dependências e criar tabelas

Abra o **PowerShell** ou **Terminal** e rode:

```powershell
cd D:\controle-obra
npm install
npm run db:setup
```

O comando `db:setup` vai:
- Criar as tabelas no Supabase (`Usuario`, `Obra`, `Funcionario`, etc.)
- Criar o admin inicial: **login `atomica`** / **senha `atomica`**

**Se `npm install` der erro de certificado**, tente:

```powershell
npm config set strict-ssl false
npm install
npm config set strict-ssl true
```

---

### Passo 3 — Rodar o app e testar

```powershell
npm run dev
```

Abra no navegador ou celular: **http://localhost:3000**

| Campo  | Valor     |
|--------|-----------|
| Login  | `atomica` |
| Senha  | `atomica` |

---

## Conferir no Supabase

1. Acesse [painel do projeto](https://supabase.com/dashboard/project/vctdqymehlzxrlterhet)
2. Menu **Table Editor**
3. Deve aparecer: `Usuario`, `Obra`, `Funcionario`, `Presenca`, `PasswordReset`

---

## ⚠️ Vercel + Supabase (importante)

O banco deste projeto usa **somente IPv6** no host direto (`db.vctdqymehlzxrlterhet.supabase.co`).
A Vercel **não consegue** conectar por esse host — por isso o login em produção dá "Erro interno".

**Solução (escolha uma):**

### Opção A — Ativar IPv4 no Supabase (mais rápido)
1. [Painel do projeto](https://supabase.com/dashboard/project/vctdqymehlzxrlterhet/settings/addons)
2. **Add-ons** → **IPv4** → ativar
3. **Connect** → copiar a URI **Direct connection** (com IPv4)
4. Colar no `.env` como `DATABASE_URL` e `DIRECT_URL`
5. Rodar: `node scripts/push-env-vercel.mjs` e `npx vercel --prod --yes`

### Opção B — Criar projeto Supabase novo
1. [supabase.com](https://supabase.com) → **New project** → nome `controle-obra`
2. Região: **South America (São Paulo)**
3. **Connect** → copiar URI **Transaction pooler** (porta 6543) e **Direct** (porta 5432)
4. Atualizar `.env`, rodar `npm run db:setup`, sincronizar Vercel e deploy

---

## Depois — publicar no GitHub + Vercel

### GitHub
```powershell
cd D:\controle-obra
git init
git add .
git commit -m "Controle Obra - app de presença em obras"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/controle-obra.git
git push -u origin main
```

### Vercel
1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório do GitHub
3. Adicione as variáveis de ambiente (copie do `.env`):
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL` → URL da Vercel (ex: `https://controle-obra.vercel.app`)
   - `RECOVERY_EMAIL_1` e `RECOVERY_EMAIL_2`
4. Clique em **Deploy**
5. Após deploy, rode localmente (com `.env` apontando para produção):
   ```powershell
   npm run db:seed
   ```

---

## Perfis do sistema

| Perfil        | O que pode fazer                                      |
|---------------|-------------------------------------------------------|
| Administrador | Cadastra e altera tudo                                |
| Mestre de Obra| Cadastra, mas não altera registros existentes         |
| Visitante     | Só visualiza resumos e exporta PDF                    |

O admin `atomica` pode cadastrar outros usuários em **Dashboard → Usuários**.
