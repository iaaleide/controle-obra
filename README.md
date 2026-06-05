# Controle Obra

Sistema de controle de funcionários e presença em obras. Interface mobile, login com perfis (Admin, Mestre, Visitante), relatórios PDF, e-mail e WhatsApp.

## Tecnologias

- Next.js 15 + TypeScript
- Prisma + PostgreSQL (Supabase)
- Tailwind CSS

## Desenvolvimento local

```bash
cd D:\controle-obra
npm install
npm run dev
```

Acesse http://localhost:3000

**Admin inicial:** login `atomica` / senha `atomica`

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha. Veja `SUPABASE.md` para conexão com o banco.

## Deploy

Instruções completas em **`DEPLOY-VERCEL.md`**.

## Perfis

| Perfil | Permissões |
|--------|------------|
| Administrador | Cadastra e altera tudo |
| Mestre de Obra | Cadastra, não altera |
| Visitante | Só visualiza e exporta PDF |
