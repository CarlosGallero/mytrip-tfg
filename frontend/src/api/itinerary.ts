import { apiCall } from './client';
import { GenerateTripRequest, TripResponse } from '../types';

/**
 * Genera un itinerario 100% personalizado mediante IA (Gemini)
 * enriquecido con imágenes reales de Wikipedia y enlaces de Google Maps.
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
