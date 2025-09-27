import React, { useState, useRef, useEffect } from 'react';

export const Popover = ({ children, open, onOpenChange }: any) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { isOpen, onOpenChange: handleOpenChange });
        }
        return child;
      })}
    </div>
  );
};

export const PopoverTrigger = ({ children, asChild, isOpen, onOpenChange }: any) => {
  const handleClick = () => {
    console.log('PopoverTrigger clicked, current isOpen:', isOpen);
    onOpenChange?.(!isOpen);
  };

  if (asChild && React.isValidElement(children)) {
    const originalOnClick = (children.props as any).onClick;
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: any) => {
        console.log('Button clicked in PopoverTrigger');
        e.preventDefault();
        e.stopPropagation();
        if (originalOnClick) {
          originalOnClick(e);
        }
        handleClick();
      },
      'aria-expanded': isOpen,
      type: 'button'
    });
  }

  return (
    <button onClick={handleClick} aria-expanded={isOpen}>
      {children}
    </button>
  );
};

export const PopoverContent = ({ children, align = 'center', className, isOpen, onOpenChange }: any) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOpenChange?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onOpenChange]);

  if (!isOpen) return null;

  const alignClass = align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 transform -translate-x-1/2';

  return (
    <div
      ref={ref}
      className={`absolute top-full mt-1 z-50 bg-white border rounded-md shadow-lg ${alignClass} ${className || ''}`}
    >
      {children}
    </div>
  );
};