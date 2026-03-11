/**
 * Calcula a distância entre dois pontos em km usando a fórmula de Haversine
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Valida se um ponto está dentro de um raio (em metros) de outro ponto
 */
function estaNoRaio(lat1, lon1, lat2, lon2, raioMetros = 200) {
  const distKm = calcularDistancia(lat1, lon1, lat2, lon2);
  return distKm * 1000 <= raioMetros;
}

module.exports = { calcularDistancia, estaNoRaio };
