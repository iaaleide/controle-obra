# Deploy no GitHub + Vercel

## Parte 1 — Enviar para o GitHub

### 1. Criar repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Nome: `controle-obra`
3. Deixe **Private** ou **Public** (sua escolha)
4. **Não** marque "Add README" (já temos um)
5. Clique em **Create repository**

### 2. Conectar e enviar o código

No PowerShell:

```powershell
cd D:\controle-obra
git remote add origin https://github.com/SEU_USUARIO_GITHUB/controle-obra.git
git push -u origin main
```

Substitua `SEU_USUARIO_GITHUB` pelo seu usuário do GitHub.

---

## Parte 2 — Deploy na Vercel

### 1. Criar conta / entrar

Acesse [vercel.com](https://vercel.com) e entre com a conta do **GitHub**.

### 2. Importar o projeto

1. **Add New…** → **Project**
2. Selecione o repositório `controle-obra`
3. Framework: **Next.js** (detectado automaticamente)
4. **Não clique em Deploy ainda** — configure as variáveis primeiro

### 3. Variáveis de ambiente (Environment Variables)

Adicione **todas** estas variáveis (copie os valores do seu `.env` local):

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | URI Transaction do Supabase (porta **6543**, com `?pgbouncer=true`) |
| `DIRECT_URL` | URI Session do Supabase (porta **5432**) |
| `JWT_SECRET` | Mesma chave do `.env` local |
| `NEXT_PUBLIC_APP_URL` | Deixe vazio por agora — atualize após o deploy com a URL da Vercel |
| `RECOVERY_EMAIL_1` | `atomica.eng@gmail.com` |
| `RECOVERY_EMAIL_2` | `ia.aleide@gmail.com` |

> **Onde pegar DATABASE_URL e DIRECT_URL:** Supabase → **Connect** → copie as URIs.

### 4. Deploy

1. Clique em **Deploy**
2. Aguarde 2–5 minutos
3. Ao terminar, copie a URL gerada (ex: `https://controle-obra-xxx.vercel.app`)

### 5. Atualizar URL do app

1. Na Vercel: **Settings** → **Environment Variables**
2. Edite `NEXT_PUBLIC_APP_URL` → cole a URL da Vercel (ex: `https://controle-obra-xxx.vercel.app`)
3. **Deployments** → três pontinhos do último deploy → **Redeploy**

---

## Parte 3 — Banco de dados

As tabelas **já existem** no Supabase (você criou pelo SQL Editor). O admin `atomica` também já está lá.

Se precisar recriar o admin em produção, rode localmente:

```powershell
cd D:\controle-obra
npm run db:seed
```

---

## Acessar pelo celular

Após o deploy, abra a URL da Vercel no navegador do celular:

```
https://sua-url.vercel.app
```

Login: `atomica` / `atomica`

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| Build falha no Prisma | Confirme `DATABASE_URL` e `DIRECT_URL` nas env vars da Vercel |
| Login não funciona | Verifique se `DATABASE_URL` usa pooler porta 6543 |
| Erro 500 | Veja logs em Vercel → Deployments → Functions / Runtime Logs |
