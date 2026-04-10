import type { PartyDetails } from '../../types';

const UNIDADES = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DECENAS = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS_RESTO = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function leerTresDigitos(n: number, isFinal: boolean): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';

  let res = '';
  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  if (c > 0) res += `${CENTENAS[c]} `;

  if (d === 1) {
    res += DECENAS[u];
  } else if (d === 2) {
    if (u === 0) res += 'veinte';
    else res += `veinti${u === 1 ? (isFinal ? 'uno' : 'un') : UNIDADES[u]}`;
  } else if (d > 2) {
    res += DECENAS_RESTO[d];
    if (u > 0) res += ` y ${u === 1 ? (isFinal ? 'uno' : 'un') : UNIDADES[u]}`;
  } else if (u > 0) {
    res += u === 1 ? (isFinal ? 'uno' : 'un') : UNIDADES[u];
  }

  return res.trim();
}

export function numberToWords(n: number | string): string {
  const num = typeof n === 'string' ? parseFloat(n.replace(/,/g, '')) : n;
  if (isNaN(num)) return '';
  if (num === 0) return 'cero';

  const enteros = Math.floor(num);
  const decimales = Math.round((num - enteros) * 100);

  if (enteros === 0) {
    return `cero con ${decimales.toString().padStart(2, '0')}/100`;
  }

  let res = '';
  let temp = enteros;

  const millones = Math.floor(temp / 1000000);
  temp %= 1000000;
  const miles = Math.floor(temp / 1000);
  const resto = temp % 1000;

  if (millones > 0) {
    if (millones === 1) res += 'un millón ';
    else res += `${leerTresDigitos(millones, false)} millones `;
  }

  if (miles > 0) {
    if (miles === 1) res += 'un mil ';
    else res += `${leerTresDigitos(miles, false)} mil `;
  }

  if (resto > 0) {
    res += leerTresDigitos(resto, true);
  }

  if (decimales > 0) {
    return `${res.trim()} con ${decimales.toString().padStart(2, '0')}/100`;
  }

  return res.trim();
}

export function getPartyIdentityNumber(party: Pick<PartyDetails, 'idNumber' | 'cui'>) {
  return (party.idNumber || party.cui || '').replace(/\D/g, '');
}

export const formatDPI = (cui: string) => {
  const clean = cui.replace(/\D/g, '');
  if (clean.length !== 13) return cui;

  const part1 = clean.substring(0, 4);
  const part2 = clean.substring(4, 9);
  const part3 = clean.substring(9, 13);

  const getWordsWithLeadingZeros = (part: string) => {
    let leadingZeros = '';
    for (let i = 0; i < part.length; i += 1) {
      if (part[i] === '0') leadingZeros += 'cero ';
      else break;
    }

    const numWords = numberToWords(part);
    return numWords === 'cero' ? leadingZeros.trim() : `${leadingZeros}${numWords}`.trim();
  };

  const words1 = getWordsWithLeadingZeros(part1);
  const words2 = getWordsWithLeadingZeros(part2);
  const words3 = getWordsWithLeadingZeros(part3);

  return `${words1}, ${words2}, ${words3} (${part1} ${part2} ${part3})`;
};

export const formatNumberWithWords = (num: number | string) => {
  if (num === undefined || num === null || num === '') return '';
  const words = numberToWords(num);
  return `${words} (${num})`;
};

export const formatPolicyType = (type: string) => {
  if (type.includes('-')) {
    const [letter, num] = type.split('-');
    return `${letter} guion ${numberToWords(num)} (${type})`;
  }

  return type;
};

export const formatDateInWords = (dateStr: string, options?: { includeYearLabel?: boolean }) => {
  if (!dateStr) return '';

  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    return dateStr;
  }

  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  const dayWords = numberToWords(day);
  const yearWords = numberToWords(year);
  const yearFragment = options?.includeYearLabel ? `del año ${yearWords}` : `de ${yearWords}`;

  return `${dayWords} de ${months[month - 1]} ${yearFragment}`;
};
