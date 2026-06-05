import nodemailer from "nodemailer";

export function validarEmail(valor: string): boolean {
  if (!valor) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

const RECOVERY_EMAILS = [
  process.env.RECOVERY_EMAIL_1 || "atomica.eng@gmail.com",
  process.env.RECOVERY_EMAIL_2 || "ia.aleide@gmail.com",
];

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });
}

export async function enviarRecuperacaoSenha(
  login: string,
  token: string
): Promise<{ ok: boolean; message: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${appUrl}/recuperar-senha?token=${token}`;
  const transporter = getTransporter();

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Recuperação de Senha — Controle Obra</h2>
      <p>Foi solicitada a recuperação de senha para o usuário <strong>${login}</strong>.</p>
      <p>Este link expira em 1 hora. Clique abaixo para definir uma nova senha:</p>
      <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
        Redefinir senha
      </a>
      <p style="color:#64748b;font-size:13px;">Se você não solicitou, ignore este e-mail.</p>
    </div>
  `;

  if (!transporter) {
    console.log("[DEV] Link de recuperação:", link);
    console.log("[DEV] E-mails destino:", RECOVERY_EMAILS.join(", "));
    return {
      ok: true,
      message:
        "Modo desenvolvimento: link gerado no console do servidor. Configure SMTP para envio real.",
    };
  }

  try {
    await Promise.all(
      RECOVERY_EMAILS.map((to) =>
        transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to,
          subject: `[Controle Obra] Recuperação de senha — ${login}`,
          html,
        })
      )
    );
    return {
      ok: true,
      message: `Link de recuperação enviado para ${RECOVERY_EMAILS.join(" e ")}.`,
    };
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    return { ok: false, message: "Falha ao enviar e-mails de recuperação." };
  }
}

export async function enviarRelatorioEmail(
  destinatario: string,
  assunto: string,
  corpo: string
): Promise<{ ok: boolean; message: string }> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log("[DEV] Relatório para:", destinatario);
    console.log("[DEV] Assunto:", assunto);
    console.log("[DEV] Corpo:", corpo);
    return { ok: true, message: "Modo desenvolvimento: relatório logado no servidor." };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: destinatario,
      subject: assunto,
      text: corpo,
    });
    return { ok: true, message: "Relatório enviado por e-mail." };
  } catch {
    return { ok: false, message: "Falha ao enviar relatório por e-mail." };
  }
}
