const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpTransport = hasSmtp ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.isFinite(smtpPort) ? smtpPort : 587,
  secure: (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : { emails: { send: () => Promise.resolve() } };

const FROM = process.env.SMTP_FROM || process.env.RESEND_FROM || 'NF Móveis <onboarding@resend.dev>';

async function sendEmail({ to, subject, html }) {
  if (hasSmtp && smtpTransport) {
    try {
      const info = await smtpTransport.sendMail({
        from: FROM,
        to,
        subject,
        html
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log('[email] SMTP sent', { messageId: info?.messageId, to, subject });
      }
      return info;
    } catch (err) {
      console.error('[email] SMTP failed', err?.message || err);
      throw err;
    }
  }
  if (process.env.RESEND_API_KEY) {
    try {
      const recipients = Array.isArray(to) ? to : [to];
      const result = await resend.emails.send({
        from: FROM,
        to: recipients,
        subject,
        html
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log('[email] Resend sent', { to, subject });
      }
      return result;
    } catch (err) {
      console.error('[email] Resend failed', err?.message || err);
      throw err;
    }
  }
  console.warn('[email] No provider configured (SMTP/Resend).');
  return null;
}

/**
 * Envia email de convite de serviço
 */
async function emailConvite({ para, nomeMontador, descricao, endereco, data, valor, linkApp }) {
  const whatsappMsg = encodeURIComponent(`Olá, novo serviço disponível: ${descricao}. Valor: R$ ${valor}. Acesse: ${linkApp}`);
  const linkWhatsapp = `https://wa.me/55${para.replace(/\D/g, '')}?text=${whatsappMsg}`;

  return sendEmail({
    to: [para],
    subject: `🔔 Novo Serviço Disponível — R$ ${valor}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <div style="background:#004d4d;color:#fff;padding:24px 28px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;font-size:22px">🔔 Novo Serviço, ${nomeMontador.split(' ')[0]}!</h2>
        </div>
        <div style="background:#f8f7f4;padding:24px 28px;border-radius:0 0 12px 12px;border:1px solid #e5e4e0">
          <p style="font-size:28px;font-weight:800;color:#004d4d;margin:0 0 16px">R$ ${valor}</p>
          <p><strong>Serviço:</strong> ${descricao}</p>
          <p><strong>📍 Endereço:</strong> ${endereco}</p>
          <p><strong>📅 Data:</strong> ${data}</p>
          <p style="margin-top:24px;display:flex;gap:10px">
            <a href="${linkApp}" style="background:#C5A059;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">
              Abrir no App →
            </a>
            <a href="${linkWhatsapp}" style="background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;margin-left:10px">
              WhatsApp →
            </a>
          </p>
          <p style="font-size:12px;color:#999;margin-top:20px">Este convite expira em 20 minutos.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Envia email de aprovação de montador
 */
async function emailAprovacao({ para, nomeMontador, linkApp }) {
  return sendEmail({
    to: [para],
    subject: '✅ Cadastro Aprovado — Montador Pro',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <div style="background:#27AE60;color:#fff;padding:24px 28px;border-radius:12px 12px 0 0">
          <h2 style="margin:0">✅ Cadastro Aprovado!</h2>
        </div>
        <div style="background:#f8f7f4;padding:24px 28px;border-radius:0 0 12px 12px;border:1px solid #e5e4e0">
          <p>Olá <strong>${nomeMontador}</strong>! Seu cadastro foi aprovado.</p>
          <p>Você já pode entrar no app e receber convites de serviço.</p>
          <p style="margin-top:24px">
            <a href="${linkApp}" style="background:#004d4d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
              Acessar o App →
            </a>
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Envia email de OS concluída para o admin
 */
async function emailOSConcluida({ para, nomeMontador, numero, valor }) {
  return sendEmail({
    to: [para],
    subject: `🎉 OS ${numero} Concluída — ${nomeMontador}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2>OS ${numero} foi finalizada!</h2>
        <p><strong>Montador:</strong> ${nomeMontador}</p>
        <p><strong>Valor:</strong> R$ ${valor}</p>
        <p>Aguardando aprovação e liberação do pagamento.</p>
      </div>
    `,
  });
}

/**
 * Envia email de ativação de conta + link do PWA
 */
async function emailAtivacao({ para, nomeMontador, linkAtivacao, linkPwa }) {
  return sendEmail({
    to: [para],
    subject: 'Ative sua conta — Montador Pro',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#0f172a;color:#fff;padding:24px 28px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;font-size:22px">Ative sua conta, ${nomeMontador.split(' ')[0]}!</h2>
        </div>
        <div style="background:#f8f7f4;padding:24px 28px;border-radius:0 0 12px 12px;border:1px solid #e5e4e0">
          <p>Seu cadastro foi recebido. Para ativar a conta, clique no botão abaixo:</p>
          <p style="margin-top:16px">
            <a href="${linkAtivacao}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">
              Ativar conta
            </a>
          </p>
          <hr style="border:none;border-top:1px solid #e5e4e0;margin:24px 0" />
          <p>Quer instalar o app no celular?</p>
          <p>
            <a href="${linkPwa}" style="background:#0f766e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">
              Abrir PWA no celular
            </a>
          </p>
          <p style="font-size:12px;color:#666;margin-top:20px">Abra no navegador do celular e toque em "Adicionar à tela inicial".</p>
        </div>
      </div>
    `
  });
}

module.exports = { emailConvite, emailAprovacao, emailOSConcluida, emailAtivacao };
