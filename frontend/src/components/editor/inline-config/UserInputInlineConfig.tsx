import { type FC, useCallback, useMemo, useEffect } from 'react';
import type { 
  TextInputConfig, 
  NumberInputConfig, 
  URLInputConfig, 
  DateInputConfig 
} from '../../../types/operator.types';
import { ValidatedInput } from '../../common/ValidatedInput';
import { 
  validateTextInput, 
  validateNumberInput, 
  validateURLInput, 
  validateDateInput 
} from '../../../utils/inline-validation';

// ============================================
// Text Input Inline Config
// ============================================

interface TextInputInlineConfigProps {
  nodeId: string;
  config: TextInputConfig;
  onConfigChange: (config: TextInputConfig) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

/**
 * Inline configuration component for Text Input operator.
 * Displays label, default value, placeholder, and required toggle.
 * 
 * Requirements: 4.1 - WHEN a user adds a Text Input operator THEN the System 
 * SHALL provide a text field that can be wired to other operators
 */
export const TextInputInlineConfig: FC<TextInputInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
  onValidationChange,
}) => {
  const safeConfig: TextInputConfig = {
    label: config.label || '',
    defaultValue: config.defaultValue,
    placeholder: config.placeholder,
    required: config.required,
  };

  // Real-time validation
  const validation = useMemo(() => validateTextInput(safeConfig), [safeConfig]);

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const errorMessages = validation.errors.map(e => e.message);
      onValidationChange(validation.isValid, errorMessages);
    }
  }, [validation, onValidationChange]);

  const handleChange = useCallback((field: keyof TextInputConfig, value: unknown) => {
    onConfigChange({ ...safeConfig, [field]: value });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <ValidatedInput
        type="text"
        label="Label"
        value={safeConfig.label}
        onChange={(e) => handleChange('label', e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="e.g., Search Query"
        error={validation.fieldErrors.label}
      />

      <ValidatedInput
        type="text"
        label="Default Value"
        value={safeConfig.defaultValue || ''}
        onChange={(e) => handleChange('defaultValue', e.target.value || undefined)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="e.g., Hello World"
      />

      <ValidatedInput
        type="text"
        label="Placeholder"
        value={safeConfig.placeholder || ''}
        onChange={(e) => handleChange('placeholder', e.target.value || undefined)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="e.g., Enter your search term..."
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`${nodeId}-required`}
          checked={safeConfig.required || false}
          onChange={(e) => handleChange('required', e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-3 w-3 rounded border-border-default text-accent-purple focus:ring-accent-purple"
        />
        <label htmlFor={`${nodeId}-required`} className="text-xs text-text-secondary">
          Required
        </label>
      </div>
    </div>
  );
};

// ============================================
// Number Input Inline Config
// ============================================

interface NumberInputInlineConfigProps {
  nodeId: string;
  config: NumberInputConfig;
  onConfigChange: (config: NumberInputConfig) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

/**
 * Inline configuration component for Number Input operator.
 * Displays label, default value, min/max constraints, step, and required toggle.
 * 
 * Requirements: 4.2 - WHEN a user adds a Number Input operator THEN the System 
 * SHALL provide a numeric field with optional min/max constraints
 */
export const NumberInputInlineConfig: FC<NumberInputInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
  onValidationChange,
}) => {
  const safeConfig: NumberInputConfig = {
    label: config.label || '',
    defaultValue: config.defaultValue,
    min: config.min,
    max: config.max,
    step: config.step,
    required: config.required,
  };

  // Real-time validation
  const validation = useMemo(() => validateNumberInput(safeConfig), [safeConfig]);

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const errorMessages = validation.errors.map(e => e.message);
      onValidationChange(validation.isValid, errorMessages);
    }
  }, [validation, onValidationChange]);

  const handleChange = useCallback((field: keyof NumberInputConfig, value: unknown) => {
    onConfigChange({ ...safeConfig, [field]: value });
  }, [safeConfig, onConfigChange]);

  const parseNumber = (value: string): number | undefined => {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  };

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <ValidatedInput
        type="text"
        label="Label"
        value={safeConfig.label}
        onChange={(e) => handleChange('label', e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="e.g., Item Count"
        error={validation.fieldErrors.label}
      />

      <ValidatedInput
        type="number"
        label="Default Value"
        value={safeConfig.defaultValue ?? ''}
        onChange={(e) => handleChange('defaultValue', parseNumber(e.target.value))}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="e.g., 10"
        error={validation.fieldErrors.defaultValue}
      />

      <div className="grid grid-cols-2 gap-2">
        <ValidatedInput
          type="number"
          label="Min"
          value={safeConfig.min ?? ''}
          onChange={(e) => handleChange('min', parseNumber(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="e.g., 1"
          error={validation.fieldErrors.min}
        />
        <ValidatedInput
          type="number"
          label="Max"
          value={safeConfig.max ?? ''}
          onChange={(e) => handleChange('max', parseNumber(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="e.g., 100"
        />
      </div>

      <ValidatedInput
        type="number"
        label="Step"
        value={safeConfig.step ?? ''}
        onChange={(e) => handleChange('step', parseNumber(e.target.value))}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="e.g., 1"
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`${nodeId}-required`}
          checked={safeConfig.required || false}
          onChange={(e) => handleChange('required', e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-3 w-3 rounded border-border-default text-accent-purple focus:ring-accent-purple"
        />
        <label htmlFor={`${nodeId}-required`} className="text-xs text-text-secondary">
          Required
        </label>
      </div>
    </div>
  );
};

// ============================================
// URL Input Inline Config
// ============================================

interface URLInputInlineConfigProps {
  nodeId: string;
  config: URLInputConfig;
  onConfigChange: (config: URLInputConfig) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

/**
 * Inline configuration component for URL Input operator.
 * Displays label, default value, placeholder, and required toggle.
 * 
 * Requirements: 4.3 - WHEN a user adds a URL Input operator THEN the System 
 * SHALL provide a URL field with validation
 */
export const URLInputInlineConfig: FC<URLInputInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
  onValidationChange,
}) => {
  const safeConfig: URLInputConfig = {
    label: config.label || '',
    defaultValue: config.defaultValue,
    placeholder: config.placeholder,
    required: config.required,
  };

  // Real-time validation
  const validation = useMemo(() => validateURLInput(safeConfig), [safeConfig]);

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const errorMessages = validation.errors.map(e => e.message);
      onValidationChange(validation.isValid, errorMessages);
    }
  }, [validation, onValidationChange]);

  const handleChange = useCallback((field: keyof URLInputConfig, value: unknown) => {
    onConfigChange({ ...safeConfig, [field]: value });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <ValidatedInput
        type="text"
        label="Label"
        value={safeConfig.label}
        onChange={(e) => handleChange('label', e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="e.g., Website URL"
        error={validation.fieldErrors.label}
      />

      <ValidatedInput
        type="url"
        label="Default URL"
        value={safeConfig.defaultValue || ''}
        onChange={(e) => handleChange('defaultValue', e.target.value || undefined)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="https://example.com/page"
        error={validation.fieldErrors.defaultValue}
      />

      <ValidatedInput
        type="text"
        label="Placeholder"
        value={safeConfig.placeholder || ''}
        onChange={(e) => handleChange('placeholder', e.target.value || undefined)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="e.g., Enter a website URL..."
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`${nodeId}-required`}
          checked={safeConfig.required || false}
          onChange={(e) => handleChange('required', e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-3 w-3 rounded border-border-default text-accent-purple focus:ring-accent-purple"
        />
        <label htmlFor={`${nodeId}-required`} className="text-xs text-text-secondary">
          Required
        </label>
      </div>
    </div>
  );
};

// ============================================
// Date Input Inline Config
// ============================================

interface DateInputInlineConfigProps {
  nodeId: string;
  config: DateInputConfig;
  onConfigChange: (config: DateInputConfig) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

/**
 * Inline configuration component for Date Input operator.
 * Displays label, default value, min/max date constraints, and required toggle.
 * 
 * Requirements: 4.4 - WHEN a user adds a Date Input operator THEN the System 
 * SHALL provide a date picker field
 */
export const DateInputInlineConfig: FC<DateInputInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
  onValidationChange,
}) => {
  const safeConfig: DateInputConfig = {
    label: config.label || '',
    defaultValue: config.defaultValue,
    minDate: config.minDate,
    maxDate: config.maxDate,
    required: config.required,
  };

  // Real-time validation
  const validation = useMemo(() => validateDateInput(safeConfig), [safeConfig]);

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const errorMessages = validation.errors.map(e => e.message);
      onValidationChange(validation.isValid, errorMessages);
    }
  }, [validation, onValidationChange]);

  const handleChange = useCallback((field: keyof DateInputConfig, value: unknown) => {
    onConfigChange({ ...safeConfig, [field]: value });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <ValidatedInput
        type="text"
        label="Label"
        value={safeConfig.label}
        onChange={(e) => handleChange('label', e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="e.g., Start Date"
        error={validation.fieldErrors.label}
      />

      <ValidatedInput
        type="date"
        label="Default Date"
        value={safeConfig.defaultValue || ''}
        onChange={(e) => handleChange('defaultValue', e.target.value || undefined)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />

      <div className="grid grid-cols-2 gap-2">
        <ValidatedInput
          type="date"
          label="Min Date"
          value={safeConfig.minDate || ''}
          onChange={(e) => handleChange('minDate', e.target.value || undefined)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          error={validation.fieldErrors.minDate}
        />
        <ValidatedInput
          type="date"
          label="Max Date"
          value={safeConfig.maxDate || ''}
          onChange={(e) => handleChange('maxDate', e.target.value || undefined)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`${nodeId}-required`}
          checked={safeConfig.required || false}
          onChange={(e) => handleChange('required', e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-3 w-3 rounded border-border-default text-accent-purple focus:ring-accent-purple"
        />
        <label htmlFor={`${nodeId}-required`} className="text-xs text-text-secondary">
          Required
        </label>
      </div>
    </div>
  );
};
