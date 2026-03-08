const { Resend } = require('resend');
require('dotenv').config();

// Inicializa o Resend apenas se a chave existir para evitar erro de inicialização
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendVerificationEmail = async (email, nome, code) => {
    const activationLink = `${process.env.FRONTEND_URL}/verificar-email?code=${code}&email=${email}`;
    
    // Na versão gratuita, se o usuário ainda não configurou o domínio, 
    // o 'from' deve ser onboarding@resend.dev
    // Se configurou, usamos o e-mail oficial
    const fromEmail = process.env.EMAIL_FROM || 'Convite@nfmoveisplanejados.com.br';
    const finalFrom = fromEmail.includes('@nfmoveisplanejados.com.br') 
        ? `NF Móveis Planejados <${fromEmail}>` 
        : `MontadorPro <onboarding@resend.dev>`;

    if (!resend) {
        console.warn('RESEND_API_KEY não configurada. E-mail de verificação não enviado para:', email);
        return { id: 'mock-id', message: 'Modo desenvolvimento: chave não configurada' };
    }

    return resend.emails.send({
        from: finalFrom,
        to: [email],
        subject: '🚀 Bem-vindo à NF Móveis! Ative sua conta de Montador',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; color: #1a1a1a; border-radius: 16px; border: 1px solid #f0f0f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #C9A84C; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: -1px;">Montador<span style="color: #1a1a1a;">Pro</span></h1>
                    <p style="color: #666; font-size: 14px; margin-top: 5px;">Powered by NF Móveis Planejados</p>
                </div>
                
                <h2 style="color: #1a1a1a; font-size: 22px; margin-bottom: 10px;">Olá, ${nome}!</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #444;">Você foi convidado para fazer parte da nossa rede de profissionais de montagem. Para começar a receber suas ordens de serviço e gerenciar sua agenda, ative sua conta abaixo:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${activationLink}" style="display: inline-block; padding: 16px 36px; background-color: #C9A84C; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; transition: background-color 0.3s ease;">Ativar Minha Conta Profissional</a>
                </div>

                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                    <p style="margin: 0; font-size: 14px; color: #666; text-align: center;">Seu código de confirmação rápida:</p>
                    <p style="margin: 10px 0 0; font-size: 32px; font-weight: bold; color: #C9A84C; letter-spacing: 8px; text-align: center;">${code}</p>
                </div>

                <p style="font-size: 13px; color: #999; line-height: 1.5; text-align: center;">
                    Caso o botão não funcione, copie e cole este link no seu navegador:<br>
                    <a href="${activationLink}" style="color: #C9A84C; word-break: break-all;">${activationLink}</a>
                </p>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0 20px;">
                
                <p style="font-size: 11px; color: #aaa; text-align: center; margin: 0;">
                    © 2026 NF Móveis Planejados. Todos os direitos reservados.<br>
                    Este é um e-mail automático, por favor não responda.
                </p>
            </div>
        `,
    });
};

module.exports = {
    sendVerificationEmail,
};
