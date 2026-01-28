"use client";

import { useState, useEffect } from "react";
import { SUPPORTED_LOCALES, SupportedLocale, getSavedLocale, saveLocale, detectLocale } from "@/lib/formatters";

interface LocaleSelectorProps {
    onLocaleChange: (locale: SupportedLocale) => void;
}

export function LocaleSelector({ onLocaleChange }: LocaleSelectorProps) {
    const [locale, setLocale] = useState<SupportedLocale>('en-US');

    useEffect(() => {
        const saved = getSavedLocale();
        const initial = saved || detectLocale();
        setLocale(initial);
        onLocaleChange(initial);
    }, [onLocaleChange]);

    const handleChange = (newLocale: SupportedLocale) => {
        setLocale(newLocale);
        saveLocale(newLocale);
        onLocaleChange(newLocale);
    };

    return (
        <select
            value={locale}
            onChange={(e) => handleChange(e.target.value as SupportedLocale)}
            className="bg-[#18181b] border border-[#27272A] rounded-lg px-3 py-1.5 text-sm text-white hover:border-[#10B981]/50 focus:outline-none focus:border-[#10B981] transition-colors"
        >
            {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code}>
                    {loc.name} ({loc.currency})
                </option>
            ))}
        </select>
    );
}
