
export const Alert = ({ children, className }: any) => (
  <div className={`p-4 rounded-md border ${className || 'bg-yellow-50 border-yellow-200'}`}>
    {children}
  </div>
);

export const AlertTitle = ({ children, className }: any) => (
  <h5 className={`font-medium ${className || ''}`}>{children}</h5>
);

export const AlertDescription = ({ children, className }: any) => (
  <div className={`text-sm mt-1 ${className || ''}`}>{children}</div>
);