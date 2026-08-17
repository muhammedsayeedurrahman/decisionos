'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES, AUTO_DETECT_LANGUAGE } from '@/types/languages';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onChange: (languageCode: string) => void;
  className?: string;
  compact?: boolean;
}

/**
 * Language selector dropdown for voice transcription
 *
 * Usage:
 * ```tsx
 * <LanguageSelector
 *   selectedLanguage={language}
 *   onChange={(code) => setLanguage(code)}
 * />
 * ```
 */
export function LanguageSelector({
  selectedLanguage,
  onChange,
  className = '',
  compact = false,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const allLanguages = [AUTO_DETECT_LANGUAGE, ...SUPPORTED_LANGUAGES];
  const selected = allLanguages.find((lang) => lang.code === selectedLanguage) || AUTO_DETECT_LANGUAGE;

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2
          ${compact ? 'px-2 py-1' : 'px-3 py-2'}
          bg-zinc-100 dark:bg-zinc-800
          border border-zinc-300 dark:border-zinc-700
          rounded-lg
          hover:bg-zinc-200 dark:hover:bg-zinc-700
          transition-colors
          text-sm font-medium
          text-zinc-900 dark:text-zinc-100
        `}
      >
        <span className="text-lg">{selected.flag}</span>
        {!compact && (
          <span className="hidden sm:inline">{selected.name}</span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="
                absolute top-full mt-2 left-0
                w-64
                bg-white dark:bg-zinc-900
                rounded-xl
                shadow-xl
                border border-zinc-200 dark:border-zinc-800
                overflow-hidden
                z-50
                max-h-80
                overflow-y-auto
              "
            >
              {/* Auto-detect Option */}
              <button
                onClick={() => handleSelect(AUTO_DETECT_LANGUAGE.code)}
                className={`
                  w-full px-4 py-3
                  flex items-center justify-between
                  hover:bg-zinc-50 dark:hover:bg-zinc-800
                  transition-colors
                  border-b border-zinc-200 dark:border-zinc-800
                  ${selectedLanguage === AUTO_DETECT_LANGUAGE.code ? 'bg-brand-red/10 dark:bg-brand-red/20' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{AUTO_DETECT_LANGUAGE.flag}</span>
                  <div className="text-left">
                    <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                      {AUTO_DETECT_LANGUAGE.name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Automatically detect language
                    </div>
                  </div>
                </div>
                {selectedLanguage === AUTO_DETECT_LANGUAGE.code && (
                  <Check className="w-4 h-4 text-brand-red" />
                )}
              </button>

              {/* Language Options */}
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleSelect(language.code)}
                  className={`
                    w-full px-4 py-3
                    flex items-center justify-between
                    hover:bg-zinc-50 dark:hover:bg-zinc-800
                    transition-colors
                    ${selectedLanguage === language.code ? 'bg-brand-red/10 dark:bg-brand-red/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div className="text-left">
                      <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {language.name}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {language.nativeName}
                      </div>
                    </div>
                  </div>
                  {selectedLanguage === language.code && (
                    <Check className="w-4 h-4 text-brand-red" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
