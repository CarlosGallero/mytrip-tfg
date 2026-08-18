const COUNTRY_ISO_MAP: Record<string, string> = {
  afganistan: 'af',
  albania: 'al',
  alemania: 'de',
  andorra: 'ad',
  angola: 'ao',
  argentina: 'ar',
  armenia: 'am',
  australia: 'au',
  austria: 'at',
  azerbaiyan: 'az',
  bahamas: 'bs',
  banglades: 'bd',
  barbados: 'bb',
  barein: 'bh',
  belgica: 'be',
  belice: 'bz',
  benin: 'bj',
  bielorrusia: 'by',
  bolivia: 'bo',
  brasil: 'br',
  bulgaria: 'bg',
  canada: 'ca',
  chile: 'cl',
  china: 'cn',
  chipre: 'cy',
  colombia: 'co',
  'costa rica': 'cr',
  croacia: 'hr',
  cuba: 'cu',
  dinamarca: 'dk',
  ecuador: 'ec',
  egipto: 'eg',
  'el salvador': 'sv',
  'emiratos arabes unidos': 'ae',
  eslovaquia: 'sk',
  eslovenia: 'si',
  espana: 'es',
  'estados unidos': 'us',
  estonia: 'ee',
  filipinas: 'ph',
  finlandia: 'fi',
  francia: 'fr',
  georgia: 'ge',
  grecia: 'gr',
  guatemala: 'gt',
  honduras: 'hn',
  hungria: 'hu',
  india: 'in',
  indonesia: 'id',
  irlanda: 'ie',
  islandia: 'is',
  israel: 'il',
  italia: 'it',
  jamaica: 'jm',
  japon: 'jp',
  jordania: 'jo',
  kenia: 'ke',
  letonia: 'lv',
  lituania: 'lt',
  luxemburgo: 'lu',
  marruecos: 'ma',
  mexico: 'mx',
  monaco: 'mc',
  noruega: 'no',
  'nueva zelanda': 'nz',
  'paises bajos': 'nl',
  panama: 'pa',
  paraguay: 'py',
  peru: 'pe',
  polonia: 'pl',
  portugal: 'pt',
  'reino unido': 'gb',
  'republica checa': 'cz',
  'republica dominicana': 'do',
  rumania: 'ro',
  rusia: 'ru',
  senegal: 'sn',
  serbia: 'rs',
  singapur: 'sg',
  suecia: 'se',
  suiza: 'ch',
  tailandia: 'th',
  turquia: 'tr',
  ucrania: 'ua',
  uruguay: 'uy',
  vaticano: 'va',
  venezuela: 've',
  vietnam: 'vn',
};

function normalizeCountry(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Convierte un emoji de bandera o código regional Unicode en su código ISO de 2 letras.
 */
function emojiToCountryCode(emojiStr?: string): string {
  if (!emojiStr) return '';
  const clean = emojiStr.trim().toUpperCase();
  if (clean.length === 2 && /^[A-Z]{2}$/.test(clean)) {
    return clean;
  }
  const chars = Array.from(emojiStr);
  const isoChars: string[] = [];
  for (const char of chars) {
    const codePoint = char.codePointAt(0);
    if (codePoint && codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) {
      isoChars.push(String.fromCharCode(codePoint - 0x1f1e6 + 65));
    }
  }
  if (isoChars.length === 2) {
    return isoChars.join('');
  }
  return '';
}

/**
 * Obtiene la URL de alta definición de la bandera del país (PNG vía FlagCDN).
 * Funciona de manera universal en Windows (Web), Android, iOS y todos los navegadores.
 */
export function getCountryFlagUrl(
  countryName?: string,
  flagEmoji?: string,
  flagImageUrl?: string | null
): string {
  if (flagImageUrl && flagImageUrl.startsWith('http')) {
    return flagImageUrl;
  }

  // 1. Intentar obtener código ISO desde el emoji o código de texto
  const fromEmoji = emojiToCountryCode(flagEmoji);
  if (fromEmoji) {
    return `https://flagcdn.com/w160/${fromEmoji.toLowerCase()}.png`;
  }

  // 2. Intentar buscar por nombre de país
  const normalized = normalizeCountry(countryName || '');
  if (normalized && COUNTRY_ISO_MAP[normalized]) {
    return `https://flagcdn.com/w160/${COUNTRY_ISO_MAP[normalized]}.png`;
  }

  for (const [key, code] of Object.entries(COUNTRY_ISO_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return `https://flagcdn.com/w160/${code}.png`;
    }
  }

  return 'https://flagcdn.com/w160/es.png';
}
