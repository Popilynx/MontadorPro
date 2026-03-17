const { emailAtivacao } = require('../utils/email');
require('dotenv').config();

/**
 * Envia email de verificação usando a lógica centralizada (Brevo API)
 */
const sendVerificationEmail = async (email, nome, code) => {
    const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verificar-email?code=${code}&email=${email}`;
    const pwaLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/convite`;
    
    console.log('[emailService] Enviando email via utilitário central para:', email);
    
    return emailAtivacao({
        para: email,
        nomeMontador: nome,
        linkAtivacao: activationLink,
        linkPwa: pwaLink
    });
};

module.exports = {
    sendVerificationEmail,
};
