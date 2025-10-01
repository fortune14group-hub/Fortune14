import { OddsFormat } from './types';

export function parseLocaleNumber(input: string): number {
  const normalized = input.replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error('Ogiltigt tal');
  }
  return parsed;
}

export function parseDecimalOdds(value: string): number {
  const parsed = parseLocaleNumber(value.trim());
  if (parsed <= 1) {
    throw new Error('Decimalodds måste vara större än 1');
  }
  return parsed;
}

export function parseAmericanOdds(value: string): number {
  const parsed = parseLocaleNumber(value.trim());
  if (parsed === 0) {
    throw new Error('Amerikanska odds får inte vara 0');
  }
  if (parsed > 0) {
    return 1 + parsed / 100;
  }
  return 1 + 100 / Math.abs(parsed);
}

export function parseFractionOdds(value: string): { numerator: number; denominator: number } {
  const parts = value.split('/');
  if (parts.length !== 2) {
    throw new Error('Fraktionella odds måste anges som n/d');
  }
  const numerator = parseLocaleNumber(parts[0].trim());
  const denominator = parseLocaleNumber(parts[1].trim());
  if (denominator === 0) {
    throw new Error('Nämnaren får inte vara 0');
  }
  if (numerator <= 0 || denominator <= 0) {
    throw new Error('Fraktionella odds måste vara positiva');
  }
  return { numerator, denominator };
}

export function toDecimal(format: OddsFormat, value: string): number {
  switch (format) {
    case 'decimal':
      return parseDecimalOdds(value);
    case 'american':
      return parseAmericanOdds(value);
    case 'fraction': {
      const { numerator, denominator } = parseFractionOdds(value);
      return 1 + numerator / denominator;
    }
    default:
      throw new Error('Okänt oddsformat');
  }
}

export function toAmerican(decimalOdds: number): string {
  if (decimalOdds <= 1) {
    return '+0';
  }
  if (decimalOdds >= 2) {
    const value = Math.round((decimalOdds - 1) * 100);
    return `+${value}`;
  }
  const value = Math.round(100 / (decimalOdds - 1));
  return `${value > 0 ? '-' : ''}${Math.abs(value)}`;
}

export function toFraction(decimalOdds: number): string {
  if (decimalOdds <= 1) {
    return '0/1';
  }
  const fractional = decimalOdds - 1;
  const precision = 1000;
  let numerator = Math.round(fractional * precision);
  let denominator = precision;
  const divisor = gcd(numerator, denominator);
  numerator = numerator / divisor;
  denominator = denominator / divisor;
  return `${numerator}/${denominator}`;
}

export function impliedFromDecimal(decimalOdds: number): number {
  if (decimalOdds <= 0) {
    throw new Error('Decimalodds måste vara positiva');
  }
  return 1 / decimalOdds;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
}

export function formatDecimal(decimal: number, decimals = 2): string {
  return decimal.toFixed(decimals);
}
