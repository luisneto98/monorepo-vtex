import React, { useState, useEffect } from 'react';
import { LegalDocumentsList } from '../components/legal/LegalDocumentsList';
import { LanguageSwitcher } from '../components/legal/LanguageSwitcher';

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

const LegalDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'pt' | 'en' | 'es'>('pt');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/legal-pages/public/list`);
      if (!response.ok) {
        throw new Error('Failed to fetch legal documents');
      }
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError('Unable to load legal documents. Please try again later.');
      console.error('Error fetching legal documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (slug: string, language: string) => {
    const downloadUrl = `${process.env.REACT_APP_API_URL || ''}/api/legal-pages/public/${slug}/${language}/download`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading legal documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Legal Documents</h1>
            <LanguageSwitcher
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {documents.length > 0 ? (
          <LegalDocumentsList
            documents={documents}
            selectedLanguage={selectedLanguage}
            onDownload={handleDownload}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No legal documents available at this time.</p>
          </div>
        )}
      </div>

      <footer className="mt-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} VTEX DAY 2026. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LegalDocuments;