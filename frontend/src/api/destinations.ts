import { apiCall } from './client';
import { DestinationTravelInfo } from '../types';

export interface ValidatePlaceResult {
  is_valid: boolean;
  place_name: string;
  actual_location?: string | null;
  message: string;
}

/**
 * Obtiene los datos del país destino desde la API de Gemini (backend):
 * - Bandera del país
 * - Moneda oficial
 * - Requisitos de pasaporte personalizados según el país de origen registrado
 * - Requisitos de vacunación
 * - Situación bélica o conflictos armados
 * - Coste diario estimado por persona para esa ciudad
 */
export async function fetchDestinationTravelInfo(
  destination: string
): Promise<DestinationTravelInfo> {
  return apiCall<DestinationTravelInfo>('/destinations/travel-info', {
    method: 'POST',
    body: JSON.stringify({ destination: destination.trim() }),
  });
}

/**
 * Valida mediante IA si un monumento o lugar específico se encuentra
 * dentro de la ciudad de destino.
 */
export async function validatePlaceLocation(
  placeName: string,
  destinationCity: string,
  destinationCountry?: string | null
): Promise<ValidatePlaceResult> {
  return apiCall<ValidatePlaceResult>('/destinations/validate-place', {
    method: 'POST',
    body: JSON.stringify({
      place_name: placeName.trim(),
      destination_city: destinationCity.trim(),
      destination_country: destinationCountry ? destinationCountry.trim() : null,
    }),
  });
}
