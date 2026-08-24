import { apiCall } from './client';
import { GenerateTripRequest, TripResponse } from '../types';

/**
 * Genera un itinerario 100% personalizado mediante IA (Gemini)
 * enriquecido con enlaces de Google Maps.
 */
export async function generateTripItinerary(
  request: GenerateTripRequest
): Promise<TripResponse> {
  return apiCall<TripResponse>('/trips/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Regenera una actividad o restaurante individual de un día manteniendo
 * la optimización geográfica, presupuesto, accesibilidad y dietas.
 */
export async function regenerateTripSlot(
  tripId: string,
  dayNumber: number,
  slotIndex: number,
  replacementType: 'activity' | 'restaurant' | 'breakfast_cafe' | string
): Promise<TripResponse> {
  return apiCall<TripResponse>(`/trips/${tripId}/regenerate-slot`, {
    method: 'POST',
    body: JSON.stringify({
      day_number: dayNumber,
      slot_index: slotIndex,
      replacement_type: replacementType,
    }),
  });
}

/**
 * Recupera todos los viajes guardados en la cuenta del usuario.
 */
export async function fetchUserTrips(): Promise<TripResponse[]> {
  return apiCall<TripResponse[]>('/trips', {
    method: 'GET',
  });
}

/**
 * Obtiene el detalle completo de un itinerario por su ID.
 */
export async function fetchTripById(tripId: string): Promise<TripResponse> {
  return apiCall<TripResponse>(`/trips/${tripId}`, {
    method: 'GET',
  });
}

/**
 * Elimina un viaje guardado.
 */
export async function deleteTrip(tripId: string): Promise<void> {
  return apiCall<void>(`/trips/${tripId}`, {
    method: 'DELETE',
  });
}
