import { type FC, useState, useCallback, useMemo } from 'react';
import { Modal } from '../common/Modal';
import type { 
  TextInputConfig, 
  NumberInputConfig, 
  URLInputConfig, 
  DateInputConfig,
  OperatorType,
} from '../../types/operator.types';

// User input operator types
const USER_INPUT_TYPES: OperatorType[] = ['text-input', 'number-input', 'url-input', 'date-input'];

/**
 * Represents a user input operator node from the pipe definition
 */
export interface UserInputNode {
  id: string;
  type: OperatorType;
  data: {
    label: string;
    config: TextInputConfig | NumberInputConfig | URLInputConfig | DateInputConfig;
  };
}

/**
 * Map of node ID to user-provided value
 */
export type UserInputValues = Record<string, string | number | undefined>;

interface UserInputPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserInputValues) => void;
  userInputNodes: UserInputNode[];
}

/**
 * Dialog component that prompts users to provide values for user input operators
 * before pipe execution.
 * 
 * Requirements: 4.6 - WHEN a pipe with User Inputs is executed THEN the System 
 * SHALL prompt the user to provide values for all inputs before running
 */
export const UserInputPromptDialog: FC<UserInputPromptDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userInputNodes,
}) => {
  // Initialize values from default values in configs
  const initialValues = useMemo(() => {
    const values: UserInputValues = {};
    userInputNodes.forEach(node => {
      const config = node.data.config;
      if ('defaultValue' in config && config.defaultValue !== undefined) {
        values[node.id] = config.defaultValue;
      }
    });
    return values;
  }, [userInputNodes]);

  const [values, setValues] = useState<UserInputValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});


  // Reset values when dialog opens with new nodes
  const resetValues = useCallback(() => {
    const newValues: UserInputValues = {};
    userInputNodes.forEach(node => {
      const config = node.data.config;
      if ('defaultValue' in config && config.defaultValue !== undefined) {
        newValues[node.id] = config.defaultValue;
      }
    });
    setValues(newValues);
    setErrors({});
  }, [userInputNodes]);

  // Handle value change for a specific input
  const handleValueChange = useCallback((nodeId: string, value: string | number | undefined) => {
    setValues(prev => ({ ...prev, [nodeId]: value }));
    // Clear error when user starts typing
    if (errors[nodeId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[nodeId];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate all inputs before submission
  const validateInputs = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    userInputNodes.forEach(node => {
      const config = node.data.config;
      const value = values[node.id];
      const label = config.label || node.data.label || 'Input';
      
      // Check required fields
      if (config.required && (value === undefined || value === '')) {
        newErrors[node.id] = `${label} is required`;
        return;
      }
      
      // Type-specific validation
      if (node.type === 'number-input' && value !== undefined && value !== '') {
        const numConfig = config as NumberInputConfig;
        const numValue = typeof value === 'number' ? value : parseFloat(value as string);
        
        if (isNaN(numValue)) {
          newErrors[node.id] = `${label} must be a valid number`;
        } else if (numConfig.min !== undefined && numValue < numConfig.min) {
          newErrors[node.id] = `${label} must be at least ${numConfig.min}`;
        } else if (numConfig.max !== undefined && numValue > numConfig.max) {
          newErrors[node.id] = `${label} must be at most ${numConfig.max}`;
        }
      }
      
      if (node.type === 'url-input' && value !== undefined && value !== '') {
        try {
          new URL(value as string);
        } catch {
          newErrors[node.id] = `${label} must be a valid URL`;
        }
      }
      
      if (node.type === 'date-input' && value !== undefined && value !== '') {
        const dateConfig = config as DateInputConfig;
        const dateValue = new Date(value as string);
        
        if (isNaN(dateValue.getTime())) {
          newErrors[node.id] = `${label} must be a valid date`;
        } else {
          if (dateConfig.minDate) {
            const minDate = new Date(dateConfig.minDate);
            if (dateValue < minDate) {
              newErrors[node.id] = `${label} must be on or after ${dateConfig.minDate}`;
            }
          }
          if (dateConfig.maxDate) {
            const maxDate = new Date(dateConfig.maxDate);
            if (dateValue > maxDate) {
              newErrors[node.id] = `${label} must be on or before ${dateConfig.maxDate}`;
            }
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [userInputNodes, values]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (validateInputs()) {
      // Convert string numbers to actual numbers for number inputs
      const processedValues: UserInputValues = {};
      userInputNodes.forEach(node => {
        const value = values[node.id];
        if (node.type === 'number-input' && value !== undefined && value !== '') {
          processedValues[node.id] = typeof value === 'number' ? value : parseFloat(value as string);
        } else {
          processedValues[node.id] = value;
        }
      });
      onSubmit(processedValues);
    }
  }, [validateInputs, userInputNodes, values, onSubmit]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    resetValues();
    onClose();
  }, [resetValues, onClose]);

  // Render input field based on operator type
  const renderInputField = (node: UserInputNode) => {
    const config = node.data.config;
    const label = config.label || node.data.label || 'Input';
    const value = values[node.id];
    const error = errors[node.id];
    const inputId = `user-input-${node.id}`;
    
    const baseInputClasses = `w-full px-3 py-2 text-sm border rounded-md bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple ${
      error ? 'border-status-error' : 'border-border-default'
    }`;


    switch (node.type) {
      case 'text-input': {
        const textConfig = config as TextInputConfig;
        return (
          <div key={node.id} className="space-y-1">
            <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
              {label}
              {textConfig.required && <span className="text-status-error ml-1">*</span>}
            </label>
            <input
              id={inputId}
              type="text"
              value={(value as string) || ''}
              onChange={(e) => handleValueChange(node.id, e.target.value || undefined)}
              placeholder={textConfig.placeholder || ''}
              className={baseInputClasses}
            />
            {error && <p className="text-xs text-status-error">{error}</p>}
          </div>
        );
      }
      
      case 'number-input': {
        const numConfig = config as NumberInputConfig;
        return (
          <div key={node.id} className="space-y-1">
            <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
              {label}
              {numConfig.required && <span className="text-status-error ml-1">*</span>}
            </label>
            <input
              id={inputId}
              type="number"
              value={value ?? ''}
              onChange={(e) => handleValueChange(node.id, e.target.value || undefined)}
              min={numConfig.min}
              max={numConfig.max}
              step={numConfig.step}
              className={baseInputClasses}
            />
            {(numConfig.min !== undefined || numConfig.max !== undefined) && (
              <p className="text-xs text-text-tertiary">
                {numConfig.min !== undefined && numConfig.max !== undefined
                  ? `Range: ${numConfig.min} - ${numConfig.max}`
                  : numConfig.min !== undefined
                  ? `Min: ${numConfig.min}`
                  : `Max: ${numConfig.max}`}
              </p>
            )}
            {error && <p className="text-xs text-status-error">{error}</p>}
          </div>
        );
      }
      
      case 'url-input': {
        const urlConfig = config as URLInputConfig;
        return (
          <div key={node.id} className="space-y-1">
            <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
              {label}
              {urlConfig.required && <span className="text-status-error ml-1">*</span>}
            </label>
            <input
              id={inputId}
              type="url"
              value={(value as string) || ''}
              onChange={(e) => handleValueChange(node.id, e.target.value || undefined)}
              placeholder={urlConfig.placeholder || 'https://example.com'}
              className={baseInputClasses}
            />
            {error && <p className="text-xs text-status-error">{error}</p>}
          </div>
        );
      }
      
      case 'date-input': {
        const dateConfig = config as DateInputConfig;
        return (
          <div key={node.id} className="space-y-1">
            <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
              {label}
              {dateConfig.required && <span className="text-status-error ml-1">*</span>}
            </label>
            <input
              id={inputId}
              type="date"
              value={(value as string) || ''}
              onChange={(e) => handleValueChange(node.id, e.target.value || undefined)}
              min={dateConfig.minDate}
              max={dateConfig.maxDate}
              className={baseInputClasses}
            />
            {error && <p className="text-xs text-status-error">{error}</p>}
          </div>
        );
      }
      
      default:
        return null;
    }
  };

  const footer = (
    <>
      <button
        onClick={handleClose}
        className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-surface border border-border-default rounded-md hover:bg-bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent-purple"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        className="px-4 py-2 text-sm font-medium text-white bg-accent-purple rounded-md hover:bg-accent-purple-hover focus:outline-none focus:ring-2 focus:ring-accent-purple"
      >
        Run Pipe
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Provide Input Values"
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          This pipe requires input values. Please provide the following:
        </p>
        
        {userInputNodes.length === 0 ? (
          <p className="text-sm text-text-tertiary italic">No user inputs found.</p>
        ) : (
          <div className="space-y-4">
            {userInputNodes.map(renderInputField)}
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * Helper function to detect user input operators in a pipe definition
 */
export const detectUserInputNodes = (nodes: Array<{
  id: string;
  type?: string;
  data: {
    label: string;
    config: unknown;
  };
}>): UserInputNode[] => {
  return nodes.filter(node => 
    node.type && USER_INPUT_TYPES.includes(node.type as OperatorType)
  ) as UserInputNode[];
};

/**
 * Helper function to check if a pipe has user input operators
 */
export const hasUserInputs = (nodes: Array<{ type?: string }>): boolean => {
  return nodes.some(node => node.type && USER_INPUT_TYPES.includes(node.type as OperatorType));
};
