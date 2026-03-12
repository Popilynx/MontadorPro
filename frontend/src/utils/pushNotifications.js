import api from '../api/api';

/**
 * Converte chave VAPID Base64 para Uint8Array necessário para o navegador
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Solicita permissão e increve o usuário para notificações push
 */
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push não suportado neste navegador.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Verifica se já existe uma assinatura
    let subscription = await registration.pushManager.getSubscription();
    
    // Se não existir, cria uma nova
    if (!subscription) {
      // Busca a chave pública dinamicamente do backend
      let publicVapidKey;
      try {
        const response = await api.get('/notifications/vapid-public-key');
        publicVapidKey = response.data.publicKey;
      } catch (err) {
        console.error('Erro ao buscar chave VAPID do servidor:', err);
        return;
      }

      if (!publicVapidKey) {
        console.error('VAPID_PUBLIC_KEY não retornada pelo servidor.');
        return;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    // Envia a assinatura para o backend
    await api.post('/notifications/subscribe', subscription);
    console.log('Inscrição push realizada com sucesso!');
    return true;
  } catch (err) {
    console.error('Erro ao subscrever push:', err);
    return false;
  }
}

/**
 * Remove a inscrição de push
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
      console.log('Inscrição push removida.');
    }
  } catch (err) {
    console.error('Erro ao remover push:', err);
  }
}
