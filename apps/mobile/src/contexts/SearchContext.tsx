import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SearchSection = 'faq' | 'sessions' | 'speakers';

interface SearchContextType {
  activeSection: SearchSection;
  searchQuery: string;
  setActiveSection: (section: SearchSection) => void;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<SearchSection>('faq');
  const [searchQuery, setSearchQuery] = useState('');

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <SearchContext.Provider
      value={{
        activeSection,
        searchQuery,
        setActiveSection,
        setSearchQuery,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}