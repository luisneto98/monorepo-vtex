
export const Pagination = ({ children }: any) => (
  <nav className="flex items-center space-x-2">{children}</nav>
);

export const PaginationContent = ({ children }: any) => (
  <div className="flex items-center space-x-1">{children}</div>
);

export const PaginationItem = ({ children }: any) => <>{children}</>;

export const PaginationLink = ({ children, onClick, isActive, className }: any) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100'} ${className || ''}`}
  >
    {children}
  </button>
);

export const PaginationPrevious = ({ onClick, className }: any) => (
  <button onClick={onClick} className={`px-3 py-1 rounded bg-gray-100 ${className || ''}`}>
    Previous
  </button>
);

export const PaginationNext = ({ onClick, className }: any) => (
  <button onClick={onClick} className={`px-3 py-1 rounded bg-gray-100 ${className || ''}`}>
    Next
  </button>
);

export const PaginationEllipsis = () => <span className="px-2">...</span>;