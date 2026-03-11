const webpush = require('web-push');

/**
 * Script para gerar novas chaves VAPID para notificações push.
 * Uso: node scripts/generateKeys.js
 */

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n--- NOVAS CHAVES VAPID GERADAS ---\n');
console.log('VAPID_PUBLIC_KEY="' + vapidKeys.publicKey + '"');
console.log('VAPID_PRIVATE_KEY="' + vapidKeys.privateKey + '"');
console.log('\n----------------------------------\n');
console.log('Copie estes valores para o seu dashboard do Railway ou arquivo .env local.\n');
