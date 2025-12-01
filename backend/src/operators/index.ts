// Operator system exports

export { BaseOperator } from './base-operator';
export { OperatorRegistry, operatorRegistry } from './operator-registry';
export { FetchOperator } from './fetch-operator';
export { FilterOperator } from './filter-operator';
export { SortOperator } from './sort-operator';
export { TransformOperator } from './transform-operator';

// Source operators
export { FetchJSONOperator } from './sources/fetch-json-operator';
export { FetchCSVOperator } from './sources/fetch-csv-operator';
export { FetchRSSOperator } from './sources/fetch-rss-operator';
export { FetchPageOperator } from './sources/fetch-page-operator';

// User input operators
export { TextInputOperator } from './user-inputs/text-input-operator';
export { NumberInputOperator } from './user-inputs/number-input-operator';
export { URLInputOperator } from './user-inputs/url-input-operator';
export { DateInputOperator } from './user-inputs/date-input-operator';

// Transform operators
export { UniqueOperator } from './transforms/unique-operator';
export { TruncateOperator } from './transforms/truncate-operator';
export { TailOperator } from './transforms/tail-operator';
export { RenameOperator } from './transforms/rename-operator';

// String operators
export { StringReplaceOperator } from './string/string-replace-operator';
export { RegexOperator } from './string/regex-operator';
export { SubstringOperator } from './string/substring-operator';

// URL operators
export { URLBuilderOperator } from './url/url-builder-operator';

// Special operators
export { PipeOutputOperator } from './pipe-output-operator';

export * from '../types/operator.types';

// Import operators for registration
import { operatorRegistry } from './operator-registry';
import { FetchOperator } from './fetch-operator';
import { FilterOperator } from './filter-operator';
import { SortOperator } from './sort-operator';
import { TransformOperator } from './transform-operator';
import { FetchJSONOperator } from './sources/fetch-json-operator';
import { FetchCSVOperator } from './sources/fetch-csv-operator';
import { FetchRSSOperator } from './sources/fetch-rss-operator';
import { FetchPageOperator } from './sources/fetch-page-operator';

// User input operators
import { TextInputOperator } from './user-inputs/text-input-operator';
import { NumberInputOperator } from './user-inputs/number-input-operator';
import { URLInputOperator } from './user-inputs/url-input-operator';
import { DateInputOperator } from './user-inputs/date-input-operator';

// Transform operators
import { UniqueOperator } from './transforms/unique-operator';
import { TruncateOperator } from './transforms/truncate-operator';
import { TailOperator } from './transforms/tail-operator';
import { RenameOperator } from './transforms/rename-operator';

// String operators
import { StringReplaceOperator } from './string/string-replace-operator';
import { RegexOperator } from './string/regex-operator';
import { SubstringOperator } from './string/substring-operator';

// URL operators
import { URLBuilderOperator } from './url/url-builder-operator';

// Special operators
import { PipeOutputOperator } from './pipe-output-operator';

// Track if operators have been registered to make function idempotent
let operatorsRegistered = false;

/**
 * Register all operators with the registry.
 * This function is idempotent - safe to call multiple times.
 * Should be called once at application startup.
 */
export function registerAllOperators(): void {
  // Prevent double registration
  if (operatorsRegistered) {
    return;
  }
  
  // Register legacy fetch operator (backward compatibility)
  // Note: We keep 'fetch' as a separate operator for existing pipes
  operatorRegistry.register(new FetchOperator());
  
  // Register new source operators
  operatorRegistry.register(new FetchJSONOperator());
  operatorRegistry.register(new FetchCSVOperator());
  operatorRegistry.register(new FetchRSSOperator());
  operatorRegistry.register(new FetchPageOperator());
  
  // Register user input operators
  operatorRegistry.register(new TextInputOperator());
  operatorRegistry.register(new NumberInputOperator());
  operatorRegistry.register(new URLInputOperator());
  operatorRegistry.register(new DateInputOperator());
  
  // Register transformation operators
  operatorRegistry.register(new FilterOperator());
  operatorRegistry.register(new SortOperator());
  operatorRegistry.register(new TransformOperator());
  operatorRegistry.register(new UniqueOperator());
  operatorRegistry.register(new TruncateOperator());
  operatorRegistry.register(new TailOperator());
  operatorRegistry.register(new RenameOperator());
  
  // Register string operators
  operatorRegistry.register(new StringReplaceOperator());
  operatorRegistry.register(new RegexOperator());
  operatorRegistry.register(new SubstringOperator());
  
  // Register URL operators
  operatorRegistry.register(new URLBuilderOperator());
  
  // Register special operators
  operatorRegistry.register(new PipeOutputOperator());
  
  operatorsRegistered = true;
}

/**
 * Get an operator by type, with 'fetch' aliased to 'fetch-json' for backward compatibility.
 * @param type - Operator type
 * @returns Operator instance or undefined
 */
export function getOperator(type: string) {
  // Alias 'fetch' to 'fetch-json' for backward compatibility
  // Note: We keep both registered - 'fetch' for existing pipes, 'fetch-json' for new ones
  return operatorRegistry.get(type);
}
