const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : { emails: { send: () => Promise.resolve() } };


const FROM = process.env.RESEND_FROM || 'NF Móveis <onboarding@resend.dev>';

/**
 * Envia email de convite de serviço
 */
async function emailConvite({ para, nomeMontador, descricao, endereco, data, valor, linkApp }) {
  if (!process.env.RESEND_API_KEY) return;
  
  const whatsappMsg = encodeURIComponent(`Olá, novo serviço disponível: ${descricao}. Valor: R$ ${valor}. Acesse: ${linkApp}`);
  const linkWhatsapp = `https://wa.me/55${para.replace(/\D/g, '')}?text=${whatsappMsg}`;

  return resend.emails.send({
    from: FROM,
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
  if (!process.env.RESEND_API_KEY) return;

  return resend.emails.send({
    from: FROM,
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
  if (!process.env.RESEND_API_KEY) return;

  return resend.emails.send({
    from: FROM,
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

module.exports = { emailConvite, emailAprovacao, emailOSConcluida };
