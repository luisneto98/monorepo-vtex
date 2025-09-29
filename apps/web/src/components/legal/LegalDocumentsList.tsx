import React from 'react';

interface LegalDocument {
  slug: string;
  type: string;
  title: {
    pt?: string;
    en?: string;
    es?: string;
  };
  availableLanguages: string[];
}

interface LegalDocumentsListProps {
  documents: LegalDocument[];
  selectedLanguage: 'pt' | 'en' | 'es';
  onDownload: (slug: string, language: string) => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'terms':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'privacy':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case 'cookies':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
  }
};

const getTypeLabel = (type: string, language: 'pt' | 'en' | 'es') => {
  const labels: { [key: string]: { [key: string]: string } } = {
    terms: {
      pt: 'Termos de Uso',
      en: 'Terms of Use',
      es: 'Términos de Uso',
    },
    privacy: {
      pt: 'Política de Privacidade',
      en: 'Privacy Policy',
      es: 'Política de Privacidad',
    },
    cookies: {
      pt: 'Política de Cookies',
      en: 'Cookie Policy',
      es: 'Política de Cookies',
    },
    other: {
      pt: 'Outros Documentos',
      en: 'Other Documents',
      es: 'Otros Documentos',
    },
  };
  return labels[type]?.[language] || type;
};

export const LegalDocumentsList: React.FC<LegalDocumentsListProps> = ({
  documents,
  selectedLanguage,
  onDownload,
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => {
        const isAvailable = doc.availableLanguages.includes(selectedLanguage);
        const title = doc.title[selectedLanguage] || doc.title.en || doc.title.pt || doc.slug;

        return (
          <div
            key={doc.slug}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-blue-600">
                  {getTypeIcon(doc.type)}
                </div>
                {isAvailable && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>

              <p className="text-sm text-gray-500 mb-4">
                {getTypeLabel(doc.type, selectedLanguage)}
              </p>

              <div className="border-t pt-4">
                {isAvailable ? (
                  <button
                    onClick={() => onDownload(doc.slug, selectedLanguage)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Not available in selected language
                    </p>
                    {doc.availableLanguages.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Available in: {doc.availableLanguages.map(lang => lang.toUpperCase()).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};