import React, { useState, createContext, useContext } from 'react';

const CommandContext = createContext<{
  search: string;
  setSearch: (search: string) => void;
  visibleItemsCount: number;
  setVisibleItemsCount: (count: number) => void;
}>({
  search: '',
  setSearch: () => {},
  visibleItemsCount: 0,
  setVisibleItemsCount: () => {},
});

export const Command = ({ children }: any) => {
  const [search, setSearch] = useState('');
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);

  return (
    <CommandContext.Provider value={{ search, setSearch, visibleItemsCount, setVisibleItemsCount }}>
      <div className="w-full">{children}</div>
    </CommandContext.Provider>
  );
};

export const CommandInput = ({ placeholder }: any) => {
  const { search, setSearch } = useContext(CommandContext);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full px-3 py-2 border-b border-gray-200 outline-none"
    />
  );
};

export const CommandEmpty = ({ children }: any) => {
  const { visibleItemsCount } = useContext(CommandContext);

  if (visibleItemsCount > 0) return null;

  return (
    <div className="p-4 text-center text-gray-500 text-sm">{children}</div>
  );
};

export const CommandGroup = ({ children, className }: any) => {
  const { setVisibleItemsCount } = useContext(CommandContext);

  React.useEffect(() => {
    // Count visible children that are CommandItem components
    const visibleCount = React.Children.toArray(children).filter(child =>
      React.isValidElement(child) && child.type === CommandItem
    ).length;
    setVisibleItemsCount(visibleCount);
  }, [children, setVisibleItemsCount]);

  return (
    <div className={`${className || ''}`}>{children}</div>
  );
};

export const CommandItem = ({ children, onSelect, value, className }: any) => {
  const { search } = useContext(CommandContext);

  // More flexible search - extract text content from children and search in value
  const getTextContent = (node: any): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return node.toString();
    if (React.isValidElement(node) && node.props && (node.props as any).children) {
      return getTextContent((node.props as any).children);
    }
    if (Array.isArray(node)) {
      return node.map(getTextContent).join(' ');
    }
    return '';
  };

  const textContent = getTextContent(children);
  const shouldShow = !search ||
    (value && value.toLowerCase().includes(search.toLowerCase())) ||
    textContent.toLowerCase().includes(search.toLowerCase());

  if (!shouldShow) return null;

  return (
    <button
      onClick={() => {
        console.log('CommandItem clicked:', value);
        onSelect?.(value);
      }}
      className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center transition-colors ${className || ''}`}
    >
      {children}
    </button>
  );
};