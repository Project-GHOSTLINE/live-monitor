import { getDB } from '../db/adapter';
import { isSupabaseConfigured } from '../db/supabase';
import { hash } from '../utils/helpers';

type TranslationService = 'deepl' | 'google' | 'none';

export interface TranslationConfig {
  primaryService: TranslationService;
  fallbackService: TranslationService;
  enableCache: boolean;
}

const DEFAULT_CONFIG: TranslationConfig = {
  primaryService: 'deepl',
  fallbackService: 'google',
  enableCache: true,
};

/**
 * Translate text to English with caching and fallback
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string = 'en',
  config: TranslationConfig = DEFAULT_CONFIG
): Promise<string> {
  // Skip if already in target language
  if (sourceLang === targetLang) {
    return text;
  }

  // Check cache first
  if (config.enableCache) {
    const cached = getCachedTranslation(text, sourceLang, targetLang);
    if (cached) return cached;
  }

  // Try primary service
  try {
    const translated = await translateWithService(
      text,
      sourceLang,
      targetLang,
      config.primaryService
    );

    // Cache result
    if (config.enableCache) {
      cacheTranslation(text, sourceLang, targetLang, translated, config.primaryService);
    }

    return translated;
  } catch (error) {
    console.error(`Primary translation failed (${config.primaryService}):`, error);

    // Fallback to secondary service
    if (config.fallbackService !== config.primaryService) {
      try {
        const translated = await translateWithService(
          text,
          sourceLang,
          targetLang,
          config.fallbackService
        );

        if (config.enableCache) {
          cacheTranslation(text, sourceLang, targetLang, translated, config.fallbackService);
        }

        return translated;
      } catch (fallbackError) {
        console.error(`Fallback translation failed (${config.fallbackService}):`, fallbackError);
      }
    }

    // Return original if all fails
    return text;
  }
}

async function translateWithService(
  text: string,
  sourceLang: string,
  targetLang: string,
  service: TranslationService
): Promise<string> {
  if (service === 'deepl') {
    return translateWithDeepL(text, sourceLang, targetLang);
  } else if (service === 'google') {
    return translateWithGoogle(text, sourceLang, targetLang);
  } else {
    throw new Error('No translation service configured');
  }
}

/**
 * DeepL API integration
 */
async function translateWithDeepL(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error('DEEPL_API_KEY not configured');

  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      source_lang: sourceLang.toUpperCase(),
      target_lang: targetLang.toUpperCase(),
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.status}`);
  }

  const data = await response.json();
  return data.translations[0].text;
}

/**
 * Google Translate API integration
 */
async function translateWithGoogle(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_TRANSLATE_API_KEY not configured');

  const url = new URL('https://translation.googleapis.com/language/translate/v2');
  url.searchParams.append('key', apiKey);
  url.searchParams.append('q', text);
  url.searchParams.append('source', sourceLang);
  url.searchParams.append('target', targetLang);
  url.searchParams.append('format', 'text');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google Translate API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data.translations[0].translatedText;
}

function getCachedTranslation(
  text: string,
  sourceLang: string,
  targetLang: string
): string | null {
  // TODO: Implement cache for Supabase
  if (isSupabaseConfigured()) {
    return null; // Cache disabled for Supabase
  }

  const { getDatabase } = require('../db/client');
  const db = getDatabase();
  const textHash = hash(text);

  const result = db
    .prepare(
      `SELECT translated_text FROM translation_cache
       WHERE source_text_hash = ? AND source_lang = ? AND target_lang = ?`
    )
    .get(textHash, sourceLang, targetLang) as { translated_text: string } | undefined;

  return result?.translated_text || null;
}

function cacheTranslation(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  translatedText: string,
  service: TranslationService
): void {
  // TODO: Implement cache for Supabase
  if (isSupabaseConfigured()) {
    return; // Cache disabled for Supabase
  }

  const { getDatabase } = require('../db/client');
  const db = getDatabase();
  const textHash = hash(sourceText);

  db.prepare(
    `INSERT OR REPLACE INTO translation_cache
     (source_text_hash, source_lang, target_lang, translated_text, service)
     VALUES (?, ?, ?, ?, ?)`
  ).run(textHash, sourceLang, targetLang, translatedText, service);
}
