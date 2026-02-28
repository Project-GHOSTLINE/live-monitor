'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function TestLangPage() {
  const { t, locale } = useLanguage();

  return (
    <div className="min-h-screen bg-black text-green-400 p-8">
      <LanguageSwitcher />

      <div className="max-w-2xl mx-auto mt-20 space-y-8">
        <h1 className="text-4xl font-bold">Language Test Page</h1>

        <div className="space-y-4 font-mono">
          <p><strong>Current Locale:</strong> {locale}</p>

          <div className="border border-green-500 p-4 rounded">
            <h2 className="text-2xl mb-4">Translations:</h2>
            <ul className="space-y-2">
              <li>• cc.title: "{t('cc.title')}"</li>
              <li>• cc.loading: "{t('cc.loading')}"</li>
              <li>• cc.initializing: "{t('cc.initializing')}"</li>
              <li>• defcon.1: "{t('defcon.1')}"</li>
              <li>• defcon.5: "{t('defcon.5')}"</li>
            </ul>
          </div>

          <p className="text-sm opacity-60">
            Click the flags above to switch language
          </p>
        </div>
      </div>
    </div>
  );
}
