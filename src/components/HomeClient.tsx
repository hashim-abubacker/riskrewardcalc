"use client";

import { useState } from "react";
import Calculator from "@/components/Calculator";
import { LocaleSelector } from "@/components/LocaleSelector";
import { FeedbackButton } from "@/components/FeedbackButton";
import { SupportedLocale } from "@/lib/formatters";

export function HomeClient() {
  const [locale, setLocale] = useState<SupportedLocale>('en-US');

  return (
    <>
      {/* Locale Selector & Feedback Button */}
      <div className="max-w-[1000px] mx-auto px-3 mb-4 flex justify-end gap-2">
        <FeedbackButton />
        <LocaleSelector onLocaleChange={setLocale} />
      </div>

      {/* Calculator */}
      <Calculator locale={locale} />
    </>
  );
}
