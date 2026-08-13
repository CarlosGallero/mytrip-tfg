import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'accessToken';

// Configuración base de la API
const API_URL_ENV = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE_URL = API_URL_ENV || 'http://localhost:8000/api/v1';

// Tipos de respuestas comunes
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

const readToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
};

const saveToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

const clearToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

/**
 * Realiza una petición fetch con configuración base
 */
export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const accessToken = await readToken();

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let error: any;
      try {
        error = await response.json();
      } catch {
        error = {
          detail: `Error ${response.status}: ${response.statusText}`,
        };
      }
      throw new Error(error.detail || error.message || 'Error en la petición');
    }

    try {
      return await response.json();
    } catch {
      return {} as T;
    }
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

/**
 * Configurar el cliente API - útil para autenticación global
 */
export const configureAPI = async (token?: string): Promise<void> => {
  if (token) {
    await saveToken(token);
  }
};

/**
 * Limpiar la configuración del cliente - usado al cerrar sesión
 */
export const clearAPIConfig = async (): Promise<void> => {
  await clearToken();
};
