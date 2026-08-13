import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from './client';

const TOKEN_KEY = 'accessToken';
const TOKEN_TYPE_KEY = 'tokenType';
const USER_ID_KEY = 'userId';
const USERNAME_KEY = 'username';

export interface UserRegister {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  confirm_password: string;
  country_of_residence: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  country_of_residence: string;
  default_currency: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthError {
  detail: string;
}

const setWebStorage = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(key, value);
  }
};

const getWebStorage = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.localStorage.getItem(key);
  }
  return null;
};

const removeWebStorage = async (key: string): Promise<void> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.removeItem(key);
  }
};

/**
 * Obtiene la lista de países disponibles para el registro
 */
export const getCountries = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/countries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener lista de países');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
};

/**
 * Registra un nuevo usuario
 */
export const registerUser = async (userData: UserRegister): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      let error: AuthError;
      try {
        error = await response.json();
      } catch {
        error = { detail: 'Error en el registro' };
      }
      throw new Error(error.detail || 'Error en el registro');
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Inicia sesión con un usuario existente
 */
export const loginUser = async (credentials: UserLogin): Promise<TokenResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let error: AuthError;
      try {
        error = await response.json();
      } catch {
        error = { detail: 'Error en el inicio de sesión' };
      }
      throw new Error(error.detail || 'Error en el inicio de sesión');
    }

    const data: TokenResponse = await response.json();

    if (Platform.OS === 'web') {
      await setWebStorage(TOKEN_KEY, data.access_token);
      await setWebStorage(TOKEN_TYPE_KEY, data.token_type);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
      await SecureStore.setItemAsync(TOKEN_TYPE_KEY, data.token_type);
    }

    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Cierra la sesión del usuario actual
 */
export const logoutUser = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    await removeWebStorage(TOKEN_KEY);
    await removeWebStorage(TOKEN_TYPE_KEY);
    await removeWebStorage(USER_ID_KEY);
    await removeWebStorage(USERNAME_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(TOKEN_TYPE_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
  await SecureStore.deleteItemAsync(USERNAME_KEY);
};

/**
 * Obtiene el token de acceso almacenado
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return getWebStorage(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
};

/**
 * Obtiene el tipo de token
 */
export const getTokenType = async (): Promise<string> => {
  if (Platform.OS === 'web') {
    return (await getWebStorage(TOKEN_TYPE_KEY)) || 'bearer';
  }

  return (await SecureStore.getItemAsync(TOKEN_TYPE_KEY)) || 'bearer';
};

/**
 * Verifica si el usuario está autenticado
 */
export const isAuthenticated = async (): Promise<boolean> => {
  return !!(await getAccessToken());
};

/**
 * Guarda información del usuario autenticado
 */
export const saveUserInfo = async (userId: string, username: string): Promise<void> => {
  if (Platform.OS === 'web') {
    await setWebStorage(USER_ID_KEY, userId);
    await setWebStorage(USERNAME_KEY, username);
    return;
  }

  await SecureStore.setItemAsync(USER_ID_KEY, userId);
  await SecureStore.setItemAsync(USERNAME_KEY, username);
};

/**
 * Obtiene el ID del usuario autenticado
 */
export const getUserId = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return getWebStorage(USER_ID_KEY);
  }

  return SecureStore.getItemAsync(USER_ID_KEY);
};

/**
 * Obtiene el username del usuario autenticado
 */
export const getUsername = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return getWebStorage(USERNAME_KEY);
  }

  return SecureStore.getItemAsync(USERNAME_KEY);
};
