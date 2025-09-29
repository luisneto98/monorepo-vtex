import { Check } from 'lucide-react';

interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const Checkbox = ({
  checked = false,
  indeterminate = false,
  onCheckedChange,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}: CheckboxProps) => {
  const isChecked = checked === true;
  const isIndeterminate = checked === 'indeterminate' || indeterminate;

  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!isChecked);
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? 'mixed' : isChecked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={`
        w-4 h-4 border border-gray-300 rounded flex items-center justify-center
        ${isChecked || isIndeterminate ? 'bg-blue-500 border-blue-500' : 'bg-white'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
        ${className}
      `}
    >
      {(isChecked || isIndeterminate) && (
        <Check className="w-3 h-3 text-white" />
      )}
    </button>
  );
};