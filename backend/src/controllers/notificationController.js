const prisma = require('../config/db');

/**
 * Registra ou atualiza uma assinatura de push para o montador logado
 */
async function subscribe(req, res) {
  const { endpoint, keys } = req.body;
  const montadorId = req.montadorId;

  if (!endpoint || !keys || !keys.auth || !keys.p256dh) {
    return res.status(400).json({ error: 'Assinatura inválida: endpoint e chaves são obrigatórios.' });
  }

  try {
    // Upsert: se já existe esse endpoint para esse montador, mantém. 
    // Se mudou ou é novo, cria/atualiza.
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        auth: keys.auth,
        p256dh: keys.p256dh,
        montadorId
      },
      create: {
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh,
        montadorId
      }
    });

    res.status(201).json({ message: 'Inscrição de push registrada com sucesso.' });
  } catch (err) {
    console.error('Erro ao registrar push subscription:', err);
    res.status(500).json({ error: 'Erro interno ao registrar notificações.' });
  }
}

/**
 * Remove uma assinatura de push
 */
async function unsubscribe(req, res) {
  const { endpoint } = req.body;
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
    res.json({ message: 'Inscrição removida.' });
  } catch (err) {
    // Ignora se não existir
    res.json({ message: 'Inscrição removida ou inexistente.' });
  }
}

/**
 * Retorna a chave pública VAPID para o frontend
 */
async function getPublicKey(req, res) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({ error: 'VAPID_PUBLIC_KEY não configurada no servidor.' });
  }
  res.json({ publicKey });
}

module.exports = { subscribe, unsubscribe, getPublicKey };
