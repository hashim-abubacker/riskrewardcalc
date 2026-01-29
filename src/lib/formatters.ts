/**
 * Internationalization (i18n) formatters using the Intl API
 * Supports major currencies for number formatting
 */

export type SupportedLocale = 'en-US' | 'en-GB' | 'EUR' | 'ja-JP' | 'zh-CN' | 'en-IN' | 'ar-AE';

export const SUPPORTED_LOCALES: { code: SupportedLocale; name: string; currency: string; symbol: string }[] = [
    { code: 'en-US', name: 'USD', currency: 'USD', symbol: '$' },
    { code: 'en-GB', name: 'GBP', currency: 'GBP', symbol: '£' },
    { code: 'EUR', name: 'EUR', currency: 'EUR', symbol: '€' },
    { code: 'ja-JP', name: 'JPY', currency: 'JPY', symbol: '¥' },
    { code: 'zh-CN', name: 'CNY', currency: 'CNY', symbol: '¥' },
    { code: 'en-IN', name: 'INR', currency: 'INR', symbol: '₹' },
    { code: 'ar-AE', name: 'AED', currency: 'AED', symbol: 'د.إ' },
];

/**
 * Get the locale code for Intl API (EUR uses de-DE formatting)
 */
function getIntlLocale(locale: SupportedLocale): string {
    if (locale === 'EUR') return 'de-DE';
    return locale;
}

/**
 * Get currency symbol for a locale
 */
export function getCurrencySymbol(locale: SupportedLocale): string {
    const localeData = SUPPORTED_LOCALES.find(l => l.code === locale);
    return localeData?.symbol || '$';
}

/**
 * Format currency with locale-specific formatting
 */
export function formatCurrency(value: number, locale: SupportedLocale): string {
    const localeData = SUPPORTED_LOCALES.find(l => l.code === locale);
    const currency = localeData?.currency || 'USD';
    const intlLocale = getIntlLocale(locale);

    return new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(value: number, locale: SupportedLocale, decimals: number = 4): string {
    const intlLocale = getIntlLocale(locale);
    return new Intl.NumberFormat(intlLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format percentage with locale-specific formatting
 */
export function formatPercentage(value: number, locale: SupportedLocale): string {
    const intlLocale = getIntlLocale(locale);
    return new Intl.NumberFormat(intlLocale, {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value / 100);
}

/**
 * Detect user's preferred locale from browser
 */
export function detectLocale(): SupportedLocale {
    if (typeof window === 'undefined') return 'en-US';

    const browserLocale = navigator.language;

    // Check for exact match
    const supported = SUPPORTED_LOCALES.find(l => l.code === browserLocale);
    if (supported) return supported.code;

    // Check for EUR countries
    const euroLocales = ['de-DE', 'es-ES', 'fr-FR', 'it-IT', 'nl-NL', 'pt-PT'];
    if (euroLocales.some(el => browserLocale.startsWith(el.split('-')[0]))) {
        return 'EUR';
    }

    // Try to match just the language part (e.g., "en" from "en-AU")
    const lang = browserLocale.split('-')[0];
    const langMatch = SUPPORTED_LOCALES.find(l => l.code.startsWith(lang));

    return langMatch?.code || 'en-US';
}

/**
 * Get saved locale from localStorage
 */
export function getSavedLocale(): SupportedLocale | null {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('locale');
    return saved as SupportedLocale | null;
}

/**
 * Save locale to localStorage
 */
export function saveLocale(locale: SupportedLocale): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('locale', locale);
}
