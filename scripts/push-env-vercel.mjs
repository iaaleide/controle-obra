import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envText = readFileSync(join(root, ".env"), "utf8");

function get(name) {
  const quoted = envText.match(new RegExp(`^${name}="([^"]+)"`, "m"));
  if (quoted) return quoted[1];
  const plain = envText.match(new RegExp(`^${name}=([^\\s#]+)`, "m"));
  return plain?.[1] ?? "";
}

const ref = "uqfkczlgfzjfrglfweqw";
const password = get("DATABASE_URL").match(/postgres:([^@]+)@/)?.[1] ?? "";

const vars = {
  DATABASE_URL: `postgresql://postgres.${ref}:${password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connection_limit=1`,
  DIRECT_URL: get("DIRECT_URL"),
  JWT_SECRET: get("JWT_SECRET"),
  NEXT_PUBLIC_APP_URL: "https://controle-obra-khaki.vercel.app",
  NEXT_PUBLIC_SUPABASE_URL: get("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  RECOVERY_EMAIL_1: get("RECOVERY_EMAIL_1"),
  RECOVERY_EMAIL_2: get("RECOVERY_EMAIL_2"),
  SMTP_FROM: get("SMTP_FROM"),
  SMTP_HOST: get("SMTP_HOST"),
  SMTP_PORT: get("SMTP_PORT"),
};

function runVercelEnv(name, envName, value) {
  const escaped = value.replace(/'/g, "''");
  const cmd = `npx vercel env add ${name} ${envName} --value '${escaped}' --force --yes`;
  execSync(cmd, { cwd: root, stdio: "pipe", shell: "powershell.exe" });
}

for (const envName of ["production"]) {
  for (const [name, value] of Object.entries(vars)) {
    if (!value) {
      console.error(`SKIP ${name} (${envName})`);
      continue;
    }
    runVercelEnv(name, envName, value);
    console.log(`OK ${name} -> ${envName}`);
  }
}

console.log("Done.");
