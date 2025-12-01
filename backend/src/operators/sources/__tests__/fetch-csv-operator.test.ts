import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FetchCSVOperator } from '../fetch-csv-operator';

describe('FetchCSVOperator', () => {
  const operator = new FetchCSVOperator();

  describe('parseCSV() - CSV parsing', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 3: CSV Round-Trip Parsing**
     * **Validates: Requirements 3.2**
     * 
     * For any valid CSV data with consistent columns, parsing the CSV should
     * produce a JSON array where each row becomes an object with keys matching
     * the header columns, and the number of objects equals the number of data rows.
     */
    it('Property 3: CSV Round-Trip Parsing - parsed row count equals data row count', () => {
      // Generate valid CSV data with headers and consistent columns
      const validIdentifier = fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s));
      
      fc.assert(
        fc.property(
          fc.array(validIdentifier, { minLength: 1, maxLength: 5 }), // headers
          fc.integer({ min: 0, max: 10 }), // number of data rows
          (headers, numRows) => {
            // Ensure unique headers
            const uniqueHeaders = [...new Set(headers)];
            if (uniqueHeaders.length === 0) return true;
            
            // Generate CSV text
            const headerLine = uniqueHeaders.join(',');
            const dataLines: string[] = [];
            for (let i = 0; i < numRows; i++) {
              const row = uniqueHeaders.map((_, idx) => `value${i}_${idx}`);
              dataLines.push(row.join(','));
            }
            const csvText = [headerLine, ...dataLines].join('\n');
            
            // Parse CSV
            const result = operator.parseCSV(csvText, { url: 'http://example.com' });
            
            // Verify row count matches
            return result.length === numRows;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 3: CSV Round-Trip Parsing - all header columns appear as object keys', () => {
      const validIdentifier = fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s));

      fc.assert(
        fc.property(
          fc.array(validIdentifier, { minLength: 1, maxLength: 5 }),
          (headers) => {
            const uniqueHeaders = [...new Set(headers)];
            if (uniqueHeaders.length === 0) return true;
            
            // Generate CSV with one data row
            const headerLine = uniqueHeaders.join(',');
            const dataLine = uniqueHeaders.map((_, idx) => `value${idx}`).join(',');
            const csvText = `${headerLine}\n${dataLine}`;
            
            // Parse CSV
            const result = operator.parseCSV(csvText, { url: 'http://example.com' });
            
            // Verify all headers appear as keys in the result
            if (result.length === 0) return true;
            const resultKeys = Object.keys(result[0]);
            return uniqueHeaders.every(header => resultKeys.includes(header));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 3: CSV Round-Trip Parsing - values are preserved correctly', () => {
      // Generate string values that won't be cast to numbers/booleans
      // This tests that non-numeric, non-boolean strings are preserved exactly
      const safeStringValue = fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => {
          // Exclude values that would be cast
          if (s.includes(',') || s.includes('\n') || s.includes('"')) return false;
          if (s.trim() !== s) return false;
          // Exclude numeric-looking strings
          if (!isNaN(Number(s)) && s.trim() !== '') return false;
          // Exclude boolean-looking strings
          const lower = s.toLowerCase();
          if (['true', 'false'].includes(lower)) return false;
          return true;
        });

      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)), { minLength: 1, maxLength: 3 }),
          fc.array(safeStringValue, { minLength: 1, maxLength: 3 }),
          (headers, values) => {
            const uniqueHeaders = [...new Set(headers)];
            if (uniqueHeaders.length === 0) return true;
            if (values.length === 0) return true;
            
            // Ensure values array matches headers length
            const rowValues = uniqueHeaders.map((_, idx) => values[idx % values.length] || 'default');
            
            const headerLine = uniqueHeaders.join(',');
            const dataLine = rowValues.join(',');
            const csvText = `${headerLine}\n${dataLine}`;
            
            const result = operator.parseCSV(csvText, { url: 'http://example.com' });
            
            if (result.length === 0) return true;
            
            // Check that each string value is preserved exactly
            return uniqueHeaders.every((header, idx) => {
              const expected = rowValues[idx];
              const actual = result[0][header];
              if (actual === null) return expected === '';
              return actual === expected;
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('parseCSV() - edge cases', () => {
    it('should handle empty CSV', () => {
      const result = operator.parseCSV('', { url: 'http://example.com' });
      expect(result).toEqual([]);
    });

    it('should handle CSV with only headers', () => {
      const result = operator.parseCSV('name,age,city', { url: 'http://example.com' });
      expect(result).toEqual([]);
    });

    it('should handle CSV with missing values (fills with null)', () => {
      const csv = 'name,age,city\nJohn,30,\nJane,,NYC';
      const result = operator.parseCSV(csv, { url: 'http://example.com' });
      
      expect(result).toHaveLength(2);
      expect(result[0].city).toBeNull();
      expect(result[1].age).toBeNull();
    });

    it('should handle custom delimiter', () => {
      const csv = 'name;age;city\nJohn;30;NYC';
      const result = operator.parseCSV(csv, { url: 'http://example.com', delimiter: ';' });
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: 'John', age: 30, city: 'NYC' });
    });

    it('should handle CSV without headers', () => {
      const csv = 'John,30,NYC\nJane,25,LA';
      const result = operator.parseCSV(csv, { url: 'http://example.com', hasHeader: false });
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('column_0', 'John');
      expect(result[0]).toHaveProperty('column_1', 30);
      expect(result[0]).toHaveProperty('column_2', 'NYC');
    });

    it('should cast numeric values to numbers', () => {
      const csv = 'id,count,price\n1,100,19.99';
      const result = operator.parseCSV(csv, { url: 'http://example.com' });
      
      expect(result[0].id).toBe(1);
      expect(result[0].count).toBe(100);
      expect(result[0].price).toBe(19.99);
    });

    it('should cast boolean values', () => {
      const csv = 'name,active,verified\nJohn,true,false';
      const result = operator.parseCSV(csv, { url: 'http://example.com' });
      
      expect(result[0].active).toBe(true);
      expect(result[0].verified).toBe(false);
    });

    it('should handle quoted values with commas', () => {
      const csv = 'name,address\nJohn,"123 Main St, Apt 4"';
      const result = operator.parseCSV(csv, { url: 'http://example.com' });
      
      expect(result[0].address).toBe('123 Main St, Apt 4');
    });

    it('should handle inconsistent column counts gracefully', () => {
      const csv = 'name,age,city\nJohn,30\nJane,25,NYC,extra';
      const result = operator.parseCSV(csv, { url: 'http://example.com' });
      
      // Should not throw, should handle gracefully
      expect(result).toHaveLength(2);
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
    });

    it('should reject missing URL', () => {
      const result = operator.validate({});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('URL is required');
    });

    it('should reject localhost URLs', () => {
      const result = operator.validate({ url: 'http://localhost:3000/data.csv' });
      expect(result.valid).toBe(false);
    });

    it('should reject private IP URLs', () => {
      const result = operator.validate({ url: 'http://192.168.1.1/data.csv' });
      expect(result.valid).toBe(false);
    });

    it('should accept valid URLs', () => {
      const result = operator.validate({ url: 'https://example.com/data.csv' });
      expect(result.valid).toBe(true);
    });

    it('should accept valid URLs with delimiter', () => {
      const result = operator.validate({ url: 'https://example.com/data.csv', delimiter: ';' });
      expect(result.valid).toBe(true);
    });
  });
});
