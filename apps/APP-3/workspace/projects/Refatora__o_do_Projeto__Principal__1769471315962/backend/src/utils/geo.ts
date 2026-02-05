
// GEODESIC COMPUTATION ENGINE
// Cálculos de navegação para simulação de frota

/**
 * Calcula a distância em milhas náuticas entre dois pontos (Haversine Formula)
 */
export function calculateDistanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Raio da terra em Milhas Náuticas
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Interpola a próxima posição baseada na velocidade e delta de tempo
 */
export function calculateNextPosition(
  currentLat: number, 
  currentLng: number, 
  destLat: number, 
  destLng: number, 
  speedKnots: number, 
  timeDeltaHours: number
): { lat: number, lng: number, arrived: boolean } {
  
  const distanceTotal = calculateDistanceNm(currentLat, currentLng, destLat, destLng);
  const distanceTravelled = speedKnots * timeDeltaHours; // Distância neste tick

  if (distanceTravelled >= distanceTotal) {
    return { lat: destLat, lng: destLng, arrived: true };
  }

  const fraction = distanceTravelled / distanceTotal;
  
  // Interpolação Linear Simples (funciona bem para distâncias curtas/médias no mapa plano)
  // Para precisão geodésica militar, usaríamos Great Circle bearing, mas isso basta para a visualização.
  const newLat = currentLat + (destLat - currentLat) * fraction;
  const newLng = currentLng + (destLng - currentLng) * fraction;

  return { lat: newLat, lng: newLng, arrived: false };
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}
