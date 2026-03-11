const webpush = require('web-push');
const prisma = require('../config/db');

// Configurar chaves VAPID de forma resiliente
const isPushEnabled = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;

if (isPushEnabled) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@montadorpro.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️ Push Notifications: VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY ausentes no .env.');
  console.warn('As notificações push estarão desativadas até que as chaves sejam configuradas.');
}

/**
 * Envia notificação push para um montador
 */
async function enviarNotificacao(montadorId, payload) {
  if (!isPushEnabled) return;
  
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { montadorId }
    });

    const notifications = subscriptions.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh
        }
      };

      return webpush.sendNotification(pushConfig, JSON.stringify(payload))
        .catch(async (err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Inscrição expirada ou inválida, remover do banco
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          throw err;
        });
    });

    return Promise.allSettled(notifications);
  } catch (err) {
    console.error('Erro ao enviar notificação push:', err);
  }
}

/**
 * Envia notificação de broadcast para todos os montadores
 */
async function broadcast(payload) {
  if (!isPushEnabled) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    
    const notifications = subscriptions.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh
        }
      };

      return webpush.sendNotification(pushConfig, JSON.stringify(payload))
        .catch(() => {}); // Ignora erros individuais no broadcast
    });

    return Promise.allSettled(notifications);
  } catch (err) {
    console.error('Erro no broadcast push:', err);
  }
}

module.exports = { enviarNotificacao, broadcast };
