import { apiCall } from './client';
import { DestinationTravelInfo } from '../types';

/**
 * Obtiene los datos del país destino desde la API de Gemini (backend):
 * - Bandera del país
 * - Moneda oficial
 * - Requisitos de pasaporte personalizados según el país de origen registrado
 * - Requisitos de vacunación
 * - Situación bélica o conflictos armados
 */
export async function fetchDestinationTravelInfo(
  destination: string
): Promise<DestinationTravelInfo> {
  return apiCall<DestinationTravelInfo>('/destinations/travel-info', {
    method: 'POST',
    body: JSON.stringify({ destination: destination.trim() }),
  });
}
