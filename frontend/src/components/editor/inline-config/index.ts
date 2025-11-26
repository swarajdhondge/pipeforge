// Inline configuration components for operators
// These components are embedded directly in operator nodes on the canvas

// Source operators
export { FetchJSONInlineConfig } from './FetchJSONInlineConfig';
export { FetchCSVInlineConfig } from './FetchCSVInlineConfig';
export { FetchRSSInlineConfig } from './FetchRSSInlineConfig';
export { FetchPageInlineConfig } from './FetchPageInlineConfig';

// Filter and Sort operators
export { FilterInlineConfig } from './FilterInlineConfig';
export { SortInlineConfig } from './SortInlineConfig';

// User Input operators
export {
  TextInputInlineConfig,
  NumberInputInlineConfig,
  URLInputInlineConfig,
  DateInputInlineConfig,
} from './UserInputInlineConfig';

// Transform operators
export {
  UniqueInlineConfig,
  TruncateInlineConfig,
  TailInlineConfig,
  RenameInlineConfig,
} from './TransformInlineConfig';

// Transform mappings (field extraction)
export { TransformMappingsInlineConfig } from './TransformMappingsInlineConfig';

// String operators
export {
  StringReplaceInlineConfig,
  RegexInlineConfig,
  SubstringInlineConfig,
} from './StringInlineConfig';

// URL operators
export { URLBuilderInlineConfig } from './URLBuilderInlineConfig';

// Special operators
export { PipeOutputInlineConfig } from './PipeOutputInlineConfig';
