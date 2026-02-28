'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Locale } from '@/lib/i18n/translations';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const flags: Record<Locale, string> = {
    en: '🇺🇸',
    fr: '🇨🇦',
  };

  const labels: Record<Locale, string> = {
    en: 'EN',
    fr: 'FR',
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex gap-2">
      {(['en', 'fr'] as Locale[]).map(lang => (
        <button
          key={lang}
          onClick={() => setLocale(lang)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border-2 font-mono text-sm
            transition-all duration-200 hover:scale-105
            ${
              locale === lang
                ? 'border-green-500 bg-green-500/20 text-green-400 shadow-lg shadow-green-500/30'
                : 'border-green-500/30 bg-black/60 text-green-500/60 hover:border-green-500/50 hover:text-green-400'
            }
          `}
          title={lang === 'en' ? 'English' : 'Français (QC)'}
        >
          <span className="text-xl">{flags[lang]}</span>
          <span className="font-bold tracking-wider">{labels[lang]}</span>
        </button>
      ))}
    </div>
  );
}
