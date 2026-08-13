export type CurrencyInfo = {
  code: string;
  name: string;
};

export const FALLBACK_COUNTRIES = [
  'España',
  'Francia',
  'Alemania',
  'Italia',
  'Portugal',
  'Reino Unido',
  'Estados Unidos',
  'México',
  'Colombia',
  'Argentina',
  'Perú',
  'Chile',
];

export const COUNTRY_CODES: Record<string, string> = {
  España: 'ES',
  Francia: 'FR',
  Alemania: 'DE',
  Italia: 'IT',
  Portugal: 'PT',
  'Reino Unido': 'GB',
  'Estados Unidos': 'US',
  México: 'MX',
  Colombia: 'CO',
  Argentina: 'AR',
  Perú: 'PE',
  Chile: 'CL',
};

export const COUNTRY_CURRENCIES: Record<string, CurrencyInfo> = {
  España: { code: 'EUR', name: 'Euro' },
  Francia: { code: 'EUR', name: 'Euro' },
  Alemania: { code: 'EUR', name: 'Euro' },
  Italia: { code: 'EUR', name: 'Euro' },
  Portugal: { code: 'EUR', name: 'Euro' },
  'Reino Unido': { code: 'GBP', name: 'Libra esterlina' },
  'Estados Unidos': { code: 'USD', name: 'Dólar estadounidense' },
  México: { code: 'MXN', name: 'Peso mexicano' },
  Colombia: { code: 'COP', name: 'Peso colombiano' },
  Argentina: { code: 'ARS', name: 'Peso argentino' },
  Perú: { code: 'PEN', name: 'Sol peruano' },
  Chile: { code: 'CLP', name: 'Peso chileno' },
};

export const getCountryCode = (country: string): string => {
  return COUNTRY_CODES[country] || country.slice(0, 2).toUpperCase();
};

export const getCurrencyInfo = (country: string): CurrencyInfo => {
  return COUNTRY_CURRENCIES[country] || { code: 'EUR', name: 'Euro' };
};
