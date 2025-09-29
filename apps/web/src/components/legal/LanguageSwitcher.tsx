import React from 'react';

interface LanguageSwitcherProps {
  selectedLanguage: 'pt' | 'en' | 'es';
  onLanguageChange: (language: 'pt' | 'en' | 'es') => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  selectedLanguage,
  onLanguageChange,
}) => {
  const languages = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ] as const;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Language:</span>
      <div className="inline-flex rounded-md shadow-sm" role="group">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => onLanguageChange(lang.code)}
            className={`
              px-4 py-2 text-sm font-medium transition-colors
              ${lang.code === 'pt' ? 'rounded-l-md' : ''}
              ${lang.code === 'es' ? 'rounded-r-md' : ''}
              ${
                selectedLanguage === lang.code
                  ? 'bg-blue-600 text-white border-blue-600 z-10'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
              border
              focus:z-10 focus:ring-2 focus:ring-blue-500 focus:outline-none
            `}
            aria-label={`Switch to ${lang.label}`}
          >
            <span className="mr-1.5">{lang.flag}</span>
            <span className="hidden sm:inline">{lang.label}</span>
            <span className="sm:hidden">{lang.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
};