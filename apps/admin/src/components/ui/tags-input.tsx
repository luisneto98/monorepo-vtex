import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from './input';
import { Badge } from './badge';
import { Button } from './button';

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagsInput({
  value = [],
  onChange,
  placeholder = 'Add a tag...',
  className,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions] = useState<string[]>([
    'technical',
    'business',
    'keynote',
    'workshop',
    'panel',
    'networking',
    'beginner-friendly',
    'advanced',
    'hands-on',
    'demo',
  ]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const filteredSuggestions = suggestions.filter(
    s => s.includes(inputValue.toLowerCase()) && !value.includes(s)
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="px-2 py-1">
            {tag}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 border-0 p-0 h-auto min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {inputValue && filteredSuggestions.length > 0 && (
        <div className="border rounded-md p-1">
          <div className="text-xs text-muted-foreground px-2 py-1">
            Suggestions:
          </div>
          <div className="flex flex-wrap gap-1 px-2 pb-1">
            {filteredSuggestions.slice(0, 5).map((suggestion) => (
              <Button
                key={suggestion}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  onChange([...value, suggestion]);
                  setInputValue('');
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}