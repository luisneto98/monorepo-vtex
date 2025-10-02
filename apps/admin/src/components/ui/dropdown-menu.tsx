import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const DropdownMenu = ({ children, modal }: any) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  return (
    <div className="relative inline-block">
      {React.Children.map(children, child =>
        React.cloneElement(child as any, { open, setOpen, triggerRef })
      )}
    </div>
  );
};

export const DropdownMenuTrigger = ({ children, asChild, setOpen, open, triggerRef }: any) => {
  const handleClick = () => setOpen?.(!open);
  if (asChild) {
    return React.cloneElement(children as any, { onClick: handleClick, ref: triggerRef });
  }
  return <button onClick={handleClick} ref={triggerRef}>{children}</button>;
};

export const DropdownMenuContent = ({ children, align, open, setOpen, triggerRef, className, sideOffset = 4 }: any) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const contentWidth = contentRef.current?.offsetWidth || 200;

      let left = rect.left;
      const top = rect.bottom + sideOffset;

      // Align to end (right align)
      if (align === 'end') {
        left = rect.right - contentWidth;
      }

      // Check if overflows viewport
      if (left + contentWidth > window.innerWidth) {
        left = window.innerWidth - contentWidth - 10;
      }
      if (left < 10) {
        left = 10;
      }

      setPosition({ top, left });
    }
  }, [open, triggerRef, align, sideOffset]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  const content = (
    <div
      ref={contentRef}
      className={`fixed z-50 min-w-[200px] bg-white border rounded-md shadow-lg ${className || ''}`}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {children}
    </div>
  );

  return createPortal(content, document.body);
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

export const DropdownMenuCheckboxItem = ({ children, checked, onCheckedChange, className }: any) => (
  <button
    onClick={() => onCheckedChange?.(!checked)}
    className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center ${className || ''}`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={() => {}}
      className="mr-2"
    />
    {children}
  </button>
);