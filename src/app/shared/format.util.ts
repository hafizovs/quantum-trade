export function localeTag(locale: string): string {
  return locale === 'ru' ? 'ru-RU' : 'en-US';
}

export function formatPrice(
  value: number,
  precision: number,
  locale: string,
): string {
  return new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatQty(value: number, precision: number, locale: string): string {
  return new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatUsd(value: number, locale: string): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatSignedUsd(value: number, locale: string): string {
  const formatted = formatUsd(Math.abs(value), locale);
  if (value > 0) {
    return `+${formatted}`;
  }
  if (value < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function formatTime(ts: number, locale: string): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));
}

export function formatDateTime(ts: number, locale: string): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));
}
