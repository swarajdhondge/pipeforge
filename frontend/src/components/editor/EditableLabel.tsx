import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';

interface EditableLabelProps {
  value: string;
  onChange: (newValue: string) => void;
  maxLength?: number;
}

export const EditableLabel: FC<EditableLabelProps> = ({
  value,
  onChange,
  maxLength = 50,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validate = (val: string): string | null => {
    if (!val.trim()) return 'Label cannot be empty';
    if (val.length > maxLength) return `Label must be ${maxLength} characters or less`;
    return null;
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(value);
    setError(null);
  };

  const handleSave = () => {
    const validationError = validate(editValue);
    if (validationError) {
      setError(validationError);
      return;
    }
    onChange(editValue.trim());
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation for all keys to prevent parent handlers from interfering
    e.stopPropagation();
    
    // Prevent default for backspace/delete to ensure they work in the input
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // Don't prevent default - let the input handle it naturally
      // Just stop propagation to prevent parent node deletion
      return;
    }
    
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div 
        className="flex flex-col"
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            setError(validate(e.target.value));
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => e.stopPropagation()}
          className={`px-1 py-0.5 text-sm border rounded bg-bg-surface text-text-primary ${error ? 'border-status-error' : 'border-accent-blue'}`}
          maxLength={maxLength + 10}
        />
        {error && <span className="text-xs text-status-error mt-0.5">{error}</span>}
      </div>
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className="cursor-text hover:bg-bg-surface-hover px-1 py-0.5 rounded"
      title="Double-click to edit"
    >
      {value}
    </span>
  );
};
