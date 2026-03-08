const { Resend } = require('resend');
require('dotenv').config();

// Inicializa o Resend apenas se a chave existir para evitar erro de inicialização
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendVerificationEmail = async (email, nome, code) => {
    const activationLink = `${process.env.FRONTEND_URL}/verificar-email?code=${code}&email=${email}`;
    
    // Na versão gratuita, se o usuário ainda não configurou o domínio, 
    // o 'from' deve ser onboarding@resend.dev
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    if (!resend) {
        console.warn('RESEND_API_KEY não configurada. E-mail de verificação não enviado para:', email);
        console.log('Código de verificação:', code);
        return { id: 'mock-id', message: 'Modo desenvolvimento: chave não configurada' };
    }

    return resend.emails.send({
        from: `MontadorPro <${fromEmail}>`,
        to: [email],
        subject: 'Bem-vindo ao MontadorPro! Confirme seu e-mail',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #C9A84C;">Bem-vindo, ${nome}!</h2>
                <p>Obrigado por se juntar à nossa equipe de profissionais MontadorPro.</p>
                <p>Para ativar sua conta e começar a receber ordens de serviço, clique no botão abaixo:</p>
                <a href="${activationLink}" style="display: inline-block; padding: 12px 24px; background-color: #C9A84C; color: #1e1e1e; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Ativar Minha Conta</a>
                <p style="margin-top: 20px; font-size: 0.9em; color: #666;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                <p style="font-size: 0.8em; color: #C9A84C;">${activationLink}</p>
                <p style="margin-top: 20px; border-top: 1px solid #eee; pt: 10px;">Seu código de verificação é: <strong>${code}</strong></p>
                <p style="font-size: 12px; color: #999; margin-top: 20px;">Você recebeu este e-mail porque foi cadastrado como montador no sistema MontadorPro.</p>
            </div>
        `,
    });
};

module.exports = {
    sendVerificationEmail,
};
