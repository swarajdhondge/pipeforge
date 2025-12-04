import { SchemaField, ExtractedSchema } from '../types/schema.types';

/**
 * SchemaExtractor service for extracting field schemas from various data formats.
 * Used for dynamic schema propagation in the pipe editor.
 */
export class SchemaExtractor {
  /**
   * Extract schema from JSON data.
   * Traverses nested objects using dot notation for paths.
   */
  extract(data: unknown): ExtractedSchema {
    if (data === null || data === undefined) {
      return {
        fields: [],
        rootType: 'object',
        itemCount: 0,
      };
    }

    if (Array.isArray(data)) {
      // For arrays, extract schema from the first item (or merge from multiple items)
      const fields = this.extractArraySchema(data, '');
      return {
        fields,
        rootType: 'array',
        itemCount: data.length,
      };
    }

    if (typeof data === 'object') {
      const fields = this.extractObjectSchema(data as Record<string, unknown>, '');
      return {
        fields,
        rootType: 'object',
      };
    }

    // Primitive value at root level
    return {
      fields: [],
      rootType: 'object',
    };
  }

  /**
   * Extract schema from CSV text.
   * Uses header row as field names.
   */
  extractFromCSV(csvText: string, delimiter: string = ','): ExtractedSchema {
    const trimmed = csvText.trim();
    
    if (trimmed.length === 0) {
      return {
        fields: [],
        rootType: 'array',
        itemCount: 0,
      };
    }
    
    const lines = trimmed.split(/\r?\n/);
    
    if (lines.length === 0) {
      return {
        fields: [],
        rootType: 'array',
        itemCount: 0,
      };
    }

    // Parse header row
    const headers = this.parseCSVLine(lines[0], delimiter);
    
    // Filter out empty headers
    if (headers.length === 1 && headers[0] === '') {
      return {
        fields: [],
        rootType: 'array',
        itemCount: 0,
      };
    }
    
    // Parse data rows to determine types and get samples
    const dataRows = lines.slice(1).map(line => this.parseCSVLine(line, delimiter));

    const fields: SchemaField[] = headers.map((header, index) => {
      // Get sample values from data rows
      const sampleValues = dataRows
        .map(row => row[index])
        .filter(v => v !== undefined && v !== null && v !== '');
      
      const sample = sampleValues[0];
      const type = this.inferTypeFromCSVValues(sampleValues);

      return {
        name: header,
        path: header,
        type,
        sample,
      };
    });

    return {
      fields,
      rootType: 'array',
      itemCount: dataRows.length,
    };
  }

  /**
   * Extract schema from RSS/Atom feed XML.
   * Normalizes to standard fields: title, link, description, pubDate.
   */
  extractFromRSS(xmlText: string): ExtractedSchema {
    // Parse RSS/Atom items from XML
    const items = this.parseRSSItems(xmlText);
    
    // Standard RSS fields
    const standardFields: SchemaField[] = [
      { name: 'title', path: 'title', type: 'string', sample: items[0]?.title || '' },
      { name: 'link', path: 'link', type: 'string', sample: items[0]?.link || '' },
      { name: 'description', path: 'description', type: 'string', sample: items[0]?.description || '' },
      { name: 'pubDate', path: 'pubDate', type: 'date', sample: items[0]?.pubDate || '' },
    ];

    return {
      fields: standardFields,
      rootType: 'array',
      itemCount: items.length,
    };
  }

  /**
   * Flatten nested schema to dot-notation paths.
   * Returns array of all field paths.
   */
  flattenSchema(schema: ExtractedSchema): string[] {
    const paths: string[] = [];
    this.collectPaths(schema.fields, paths);
    return paths;
  }

  // Private helper methods

  private extractObjectSchema(obj: Record<string, unknown>, prefix: string): SchemaField[] {
    const fields: SchemaField[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const field = this.createSchemaField(key, path, value);
      fields.push(field);
    }

    return fields;
  }

  private extractArraySchema(arr: unknown[], prefix: string): SchemaField[] {
    if (arr.length === 0) {
      return [];
    }

    // Merge schemas from multiple items to capture all possible fields
    const mergedFields = new Map<string, SchemaField>();

    for (const item of arr.slice(0, 10)) { // Sample first 10 items
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const itemFields = this.extractObjectSchema(item as Record<string, unknown>, prefix);
        for (const field of itemFields) {
          if (!mergedFields.has(field.path)) {
            mergedFields.set(field.path, field);
          } else {
            // Update sample if current one is null/undefined
            const existing = mergedFields.get(field.path)!;
            if (existing.sample === null || existing.sample === undefined) {
              existing.sample = field.sample;
            }
          }
        }
      }
    }

    return Array.from(mergedFields.values());
  }

  private createSchemaField(name: string, path: string, value: unknown): SchemaField {
    const type = this.inferType(value);
    const field: SchemaField = {
      name,
      path,
      type,
      sample: this.getSampleValue(value),
    };

    // Handle nested objects
    if (type === 'object' && value !== null && typeof value === 'object') {
      field.children = this.extractObjectSchema(value as Record<string, unknown>, path);
    }

    // Handle arrays
    if (type === 'array' && Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      if (firstItem !== null && typeof firstItem === 'object' && !Array.isArray(firstItem)) {
        field.children = this.extractObjectSchema(firstItem as Record<string, unknown>, path);
      }
    }

    return field;
  }

  private inferType(value: unknown): SchemaField['type'] {
    if (value === null) return 'null';
    if (value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    
    const type = typeof value;
    
    if (type === 'string') {
      // Check if it's a date string
      if (this.isDateString(value as string)) {
        return 'date';
      }
      return 'string';
    }
    
    if (type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';
    if (type === 'object') return 'object';
    
    return 'string'; // Default fallback
  }

  private inferTypeFromCSVValues(values: string[]): SchemaField['type'] {
    if (values.length === 0) return 'string';

    // Check if all values are numbers
    const allNumbers = values.every(v => !isNaN(Number(v)) && v.trim() !== '');
    if (allNumbers) return 'number';

    // Check if all values are booleans
    const boolValues = ['true', 'false', '1', '0', 'yes', 'no'];
    const allBooleans = values.every(v => boolValues.includes(v.toLowerCase()));
    if (allBooleans) return 'boolean';

    // Check if all values are dates
    const allDates = values.every(v => this.isDateString(v));
    if (allDates) return 'date';

    return 'string';
  }

  private isDateString(value: string): boolean {
    if (!value || value.trim() === '') return false;
    
    // Common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // ISO date: 2024-01-15
      /^\d{2}\/\d{2}\/\d{4}/, // US date: 01/15/2024
      /^\d{2}-\d{2}-\d{4}/, // EU date: 15-01-2024
      /^[A-Za-z]{3},?\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/, // RFC 2822: Mon, 15 Jan 2024
    ];

    if (datePatterns.some(pattern => pattern.test(value))) {
      const parsed = Date.parse(value);
      return !isNaN(parsed);
    }

    return false;
  }

  private getSampleValue(value: unknown): unknown {
    if (value === null || value === undefined) return null;
    
    if (Array.isArray(value)) {
      // Return first item or array length indicator
      return value.length > 0 ? `[${value.length} items]` : '[]';
    }
    
    if (typeof value === 'object') {
      return '{...}';
    }
    
    // Truncate long strings
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    
    return value;
  }

  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private parseRSSItems(xmlText: string): Array<{
    title: string;
    link: string;
    description: string;
    pubDate: string;
  }> {
    const items: Array<{
      title: string;
      link: string;
      description: string;
      pubDate: string;
    }> = [];

    // Simple regex-based RSS/Atom parsing
    // For RSS 2.0
    const rssItemRegex = /<item>([\s\S]*?)<\/item>/gi;
    // For Atom
    const atomEntryRegex = /<entry>([\s\S]*?)<\/entry>/gi;

    const rssMatches = xmlText.matchAll(rssItemRegex);
    const atomMatches = xmlText.matchAll(atomEntryRegex);

    // Parse RSS items
    for (const match of rssMatches) {
      const itemXml = match[1];
      items.push({
        title: this.extractXMLTag(itemXml, 'title'),
        link: this.extractXMLTag(itemXml, 'link'),
        description: this.extractXMLTag(itemXml, 'description'),
        pubDate: this.extractXMLTag(itemXml, 'pubDate'),
      });
    }

    // Parse Atom entries
    for (const match of atomMatches) {
      const entryXml = match[1];
      items.push({
        title: this.extractXMLTag(entryXml, 'title'),
        link: this.extractAtomLink(entryXml),
        description: this.extractXMLTag(entryXml, 'summary') || this.extractXMLTag(entryXml, 'content'),
        pubDate: this.extractXMLTag(entryXml, 'published') || this.extractXMLTag(entryXml, 'updated'),
      });
    }

    return items;
  }

  private extractXMLTag(xml: string, tagName: string): string {
    // Handle CDATA sections
    const cdataRegex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) {
      return cdataMatch[1].trim();
    }

    // Handle regular tags
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? this.decodeXMLEntities(match[1].trim()) : '';
  }

  private extractAtomLink(xml: string): string {
    // Atom links are in href attribute
    const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i;
    const match = xml.match(linkRegex);
    return match ? match[1] : '';
  }

  private decodeXMLEntities(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  private collectPaths(fields: SchemaField[], paths: string[]): void {
    for (const field of fields) {
      paths.push(field.path);
      if (field.children) {
        this.collectPaths(field.children, paths);
      }
    }
  }
}

// Singleton instance
let schemaExtractorInstance: SchemaExtractor | null = null;

export function getSchemaExtractor(): SchemaExtractor {
  if (!schemaExtractorInstance) {
    schemaExtractorInstance = new SchemaExtractor();
  }
  return schemaExtractorInstance;
}
