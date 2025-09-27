import React, { useState } from 'react';

export const DropdownMenu = ({ children }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {React.Children.map(children, child =>
        React.cloneElement(child as any, { open, setOpen })
      )}
    </div>
  );
};

export const DropdownMenuTrigger = ({ children, asChild, setOpen, open }: any) => {
  const handleClick = () => setOpen?.(!open);
  if (asChild) {
    return React.cloneElement(children as any, { onClick: handleClick });
  }
  return <button onClick={handleClick}>{children}</button>;
};

export const DropdownMenuContent = ({ children, align, open }: any) => {
  if (!open) return null;
  return (
    <div className={`absolute z-10 mt-1 bg-white border rounded-md shadow-lg ${align === 'end' ? 'right-0' : ''}`}>
      {children}
    </div>
  );
};

export const DropdownMenuItem = ({ children, onClick, className }: any) => (
  <button
    onClick={onClick}
    className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center ${className || ''}`}
  >
    {children}
  </button>
);

export const DropdownMenuSeparator = () => (
  <div className="border-t my-1" />
);

export const DropdownMenuLabel = ({ children, className }: any) => (
  <div className={`px-4 py-2 text-sm font-medium text-gray-500 ${className || ''}`}>
    {children}
  </div>
);