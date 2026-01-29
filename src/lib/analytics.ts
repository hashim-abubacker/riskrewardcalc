/**
 * Google Analytics 4 Custom Event Tracking
 * Tracks user interactions with the calculator
 */

// Extend window type for gtag
declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

type EventParams = Record<string, string | number | boolean>;

/**
 * Track a custom event in Google Analytics 4
 */
export const trackEvent = (eventName: string, params?: EventParams): void => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
    }
};

// ============================================
// Calculator-Specific Events
// ============================================

/**
 * Track when user performs a calculation
 */
export const trackCalculation = (params: {
    asset_class: string;
    leverage: number;
    has_target_price: boolean;
    trade_direction: 'LONG' | 'SHORT' | null;
}) => {
    trackEvent('calculate_position', {
        asset_class: params.asset_class,
        leverage: params.leverage,
        has_target_price: params.has_target_price,
        trade_direction: params.trade_direction || 'none',
    });
};

/**
 * Track asset class switch
 */
export const trackAssetClassSwitch = (from: string, to: string) => {
    trackEvent('asset_class_switch', {
        from_asset: from,
        to_asset: to,
    });
};

/**
 * Track form reset
 */
export const trackFormReset = () => {
    trackEvent('form_reset');
};

/**
 * Track reset undo
 */
export const trackResetUndo = () => {
    trackEvent('reset_undo');
};

/**
 * Track risk mode toggle ($ vs %)
 */
export const trackRiskModeToggle = (mode: 'percent' | 'fiat') => {
    trackEvent('risk_mode_toggle', {
        mode: mode,
    });
};

/**
 * Track when calculation has insufficient margin
 */
export const trackInsufficientMargin = (params: {
    asset_class: string;
    margin_required: number;
    balance: number;
}) => {
    trackEvent('insufficient_margin_warning', {
        asset_class: params.asset_class,
        margin_required: params.margin_required,
        balance: params.balance,
        shortfall: params.margin_required - params.balance,
    });
};

/**
 * Track FAQ expansion
 */
export const trackFAQExpand = (question: string) => {
    trackEvent('faq_expand', {
        question: question.substring(0, 100), // Limit to 100 chars
    });
};

/**
 * Track locale/language change
 */
export const trackLocaleChange = (locale: string) => {
    trackEvent('locale_change', {
        locale: locale,
    });
};
