import React from 'react';

export const Select = ({ children, onValueChange, defaultValue }: any) => {
  const [value, setValue] = React.useState(defaultValue || '');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(e.target.value);
    onValueChange?.(e.target.value);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
    >
      {React.Children.map(children, child => {
        if (child?.type === SelectContent) {
          return child.props.children;
        }
        return null;
      })}
    </select>
  );
};

export const SelectContent = ({ children }: any) => children;

export const SelectItem = ({ value, children }: any) => (
  <option value={value}>{children}</option>
);

export const SelectTrigger = ({ children }: any) => children;

export const SelectValue = ({ placeholder }: any) => (
  <span>{placeholder}</span>
);