/**
 * Supported languages for voice transcription
 * Based on OpenAI Whisper API supported languages
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
];

export const AUTO_DETECT_LANGUAGE: Language = {
  code: 'auto',
  name: 'Auto-detect',
  nativeName: 'Auto-detect',
  flag: '🌐',
};

export function getLanguageByCode(code: string): Language | undefined {
  if (code === 'auto') return AUTO_DETECT_LANGUAGE;
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

export function getPreferredLanguage(): string {
  if (typeof window === 'undefined') return 'en';

  const stored = localStorage.getItem('decisionos_voice_language');
  if (stored) return stored;

  // Try to detect from browser language
  const browserLang = navigator.language.split('-')[0];
  const supported = SUPPORTED_LANGUAGES.find((lang) => lang.code === browserLang);

  return supported ? supported.code : 'en';
}

export function setPreferredLanguage(code: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('decisionos_voice_language', code);
}
