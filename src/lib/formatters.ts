/**
 * Internationalization (i18n) formatters using the Intl API
 * Supports major currencies and locales for number formatting
 */

export type SupportedLocale = 'en-US' | 'en-GB' | 'de-DE' | 'es-ES' | 'fr-FR' | 'ja-JP' | 'zh-CN' | 'en-IN' | 'ar-AE';

export const SUPPORTED_LOCALES: { code: SupportedLocale; name: string; currency: string }[] = [
    { code: 'en-US', name: 'English (US)', currency: 'USD' },
    { code: 'en-GB', name: 'English (UK)', currency: 'GBP' },
    { code: 'de-DE', name: 'Deutsch', currency: 'EUR' },
    { code: 'es-ES', name: 'Español', currency: 'EUR' },
    { code: 'fr-FR', name: 'Français', currency: 'EUR' },
    { code: 'ja-JP', name: '日本語', currency: 'JPY' },
    { code: 'zh-CN', name: '中文', currency: 'CNY' },
    { code: 'en-IN', name: 'English (India)', currency: 'INR' },
    { code: 'ar-AE', name: 'العربية (UAE)', currency: 'AED' },
];

/**
 * Format currency with locale-specific formatting
 */
export function formatCurrency(value: number, locale: SupportedLocale): string {
    const localeData = SUPPORTED_LOCALES.find(l => l.code === locale);
    const currency = localeData?.currency || 'USD';

    return new Intl.NumberFormat(locale, {
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
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format percentage with locale-specific formatting
 */
export function formatPercentage(value: number, locale: SupportedLocale): string {
    return new Intl.NumberFormat(locale, {
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
    const supported = SUPPORTED_LOCALES.find(l => l.code === browserLocale);

    if (supported) return supported.code;

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
