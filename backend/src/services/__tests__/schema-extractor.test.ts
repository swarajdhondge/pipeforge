import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SchemaExtractor } from '../schema-extractor';
import { ExtractedSchema } from '../../types/schema.types';

describe('SchemaExtractor', () => {
  const extractor = new SchemaExtractor();

  describe('extract() - JSON schema extraction', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 1: Schema Extraction Completeness**
     * **Validates: Requirements 1.2**
     * 
     * For any valid JSON object, the schema extractor SHALL return all field paths
     * including nested fields using dot notation.
     */
    it('Property 1: Schema Extraction Completeness - all object keys appear in extracted paths', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.string({ minLength: 1 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
            fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.constant(null)
            )
          ),
          (obj) => {
            const schema = extractor.extract(obj);
            const paths = extractor.flattenSchema(schema);
            const keys = Object.keys(obj);
            
            // All keys should appear in the extracted paths
            return keys.every(key => paths.includes(key));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 1: Schema Extraction Completeness - nested object keys use dot notation', () => {
      fc.assert(
        fc.property(
          fc.record({
            outer: fc.record({
              inner: fc.string()
            })
          }),
          (obj) => {
            const schema = extractor.extract(obj);
            const paths = extractor.flattenSchema(schema);
            
            // Should have 'outer' and 'outer.inner' paths
            return paths.includes('outer') && paths.includes('outer.inner');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 1: Schema Extraction Completeness - array items schema is extracted', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.integer(),
              name: fc.string()
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (arr) => {
            const schema = extractor.extract(arr);
            const paths = extractor.flattenSchema(schema);
            
            // Should extract 'id' and 'name' from array items
            return schema.rootType === 'array' && 
                   paths.includes('id') && 
                   paths.includes('name');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('extract() - type inference', () => {
    it('should correctly identify string type', () => {
      const schema = extractor.extract({ name: 'test' });
      expect(schema.fields[0].type).toBe('string');
    });

    it('should correctly identify number type', () => {
      const schema = extractor.extract({ count: 42 });
      expect(schema.fields[0].type).toBe('number');
    });

    it('should correctly identify boolean type', () => {
      const schema = extractor.extract({ active: true });
      expect(schema.fields[0].type).toBe('boolean');
    });

    it('should correctly identify array type', () => {
      const schema = extractor.extract({ items: [1, 2, 3] });
      expect(schema.fields[0].type).toBe('array');
    });

    it('should correctly identify object type', () => {
      const schema = extractor.extract({ user: { name: 'test' } });
      expect(schema.fields[0].type).toBe('object');
    });

    it('should correctly identify null type', () => {
      const schema = extractor.extract({ value: null });
      expect(schema.fields[0].type).toBe('null');
    });

    it('should correctly identify date strings', () => {
      const schema = extractor.extract({ created: '2024-01-15T10:30:00Z' });
      expect(schema.fields[0].type).toBe('date');
    });
  });

  describe('extract() - edge cases', () => {
    it('should handle empty object', () => {
      const schema = extractor.extract({});
      expect(schema.fields).toHaveLength(0);
      expect(schema.rootType).toBe('object');
    });

    it('should handle empty array', () => {
      const schema = extractor.extract([]);
      expect(schema.fields).toHaveLength(0);
      expect(schema.rootType).toBe('array');
      expect(schema.itemCount).toBe(0);
    });

    it('should handle null input', () => {
      const schema = extractor.extract(null);
      expect(schema.fields).toHaveLength(0);
    });

    it('should handle undefined input', () => {
      const schema = extractor.extract(undefined);
      expect(schema.fields).toHaveLength(0);
    });

    it('should handle deeply nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      };
      const schema = extractor.extract(data);
      const paths = extractor.flattenSchema(schema);
      
      expect(paths).toContain('level1');
      expect(paths).toContain('level1.level2');
      expect(paths).toContain('level1.level2.level3');
      expect(paths).toContain('level1.level2.level3.value');
    });
  });

  describe('extractFromCSV()', () => {
    it('should extract schema from CSV with headers', () => {
      const csv = 'name,age,active\nJohn,30,true\nJane,25,false';
      const schema = extractor.extractFromCSV(csv);
      
      expect(schema.rootType).toBe('array');
      expect(schema.itemCount).toBe(2);
      expect(schema.fields).toHaveLength(3);
      expect(schema.fields.map(f => f.name)).toEqual(['name', 'age', 'active']);
    });

    it('should infer number type from CSV values', () => {
      const csv = 'id,count\n1,100\n2,200';
      const schema = extractor.extractFromCSV(csv);
      
      const idField = schema.fields.find(f => f.name === 'id');
      const countField = schema.fields.find(f => f.name === 'count');
      
      expect(idField?.type).toBe('number');
      expect(countField?.type).toBe('number');
    });

    it('should handle quoted CSV values', () => {
      const csv = 'name,description\n"John Doe","A ""quoted"" value"';
      const schema = extractor.extractFromCSV(csv);
      
      expect(schema.fields).toHaveLength(2);
      expect(schema.fields[0].name).toBe('name');
    });

    it('should handle custom delimiter', () => {
      const csv = 'name;age;city\nJohn;30;NYC';
      const schema = extractor.extractFromCSV(csv, ';');
      
      expect(schema.fields).toHaveLength(3);
      expect(schema.fields.map(f => f.name)).toEqual(['name', 'age', 'city']);
    });

    it('should handle empty CSV', () => {
      const schema = extractor.extractFromCSV('');
      expect(schema.fields).toHaveLength(0);
      expect(schema.itemCount).toBe(0);
    });
  });

  describe('extractFromRSS()', () => {
    it('should extract schema from RSS 2.0 feed', () => {
      const rss = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <item>
              <title>Article 1</title>
              <link>https://example.com/1</link>
              <description>Description 1</description>
              <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
            </item>
            <item>
              <title>Article 2</title>
              <link>https://example.com/2</link>
              <description>Description 2</description>
              <pubDate>Tue, 16 Jan 2024 10:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;
      
      const schema = extractor.extractFromRSS(rss);
      
      expect(schema.rootType).toBe('array');
      expect(schema.itemCount).toBe(2);
      expect(schema.fields.map(f => f.name)).toEqual(['title', 'link', 'description', 'pubDate']);
    });

    it('should extract schema from Atom feed', () => {
      const atom = `
        <?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Test Feed</title>
          <entry>
            <title>Article 1</title>
            <link href="https://example.com/1"/>
            <summary>Summary 1</summary>
            <published>2024-01-15T10:00:00Z</published>
          </entry>
        </feed>
      `;
      
      const schema = extractor.extractFromRSS(atom);
      
      expect(schema.rootType).toBe('array');
      expect(schema.itemCount).toBe(1);
      expect(schema.fields.map(f => f.name)).toEqual(['title', 'link', 'description', 'pubDate']);
    });

    it('should handle RSS with CDATA sections', () => {
      const rss = `
        <rss version="2.0">
          <channel>
            <item>
              <title><![CDATA[Article with <special> chars]]></title>
              <link>https://example.com/1</link>
              <description><![CDATA[<p>HTML content</p>]]></description>
              <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;
      
      const schema = extractor.extractFromRSS(rss);
      
      expect(schema.itemCount).toBe(1);
      expect(schema.fields[0].sample).toBe('Article with <special> chars');
    });

    it('should return standard fields even for empty feed', () => {
      const rss = '<rss version="2.0"><channel></channel></rss>';
      const schema = extractor.extractFromRSS(rss);
      
      expect(schema.fields.map(f => f.name)).toEqual(['title', 'link', 'description', 'pubDate']);
      expect(schema.itemCount).toBe(0);
    });
  });

  describe('flattenSchema()', () => {
    it('should return all paths including nested', () => {
      const schema: ExtractedSchema = {
        fields: [
          {
            name: 'user',
            path: 'user',
            type: 'object',
            children: [
              { name: 'name', path: 'user.name', type: 'string' },
              { name: 'email', path: 'user.email', type: 'string' }
            ]
          },
          { name: 'active', path: 'active', type: 'boolean' }
        ],
        rootType: 'object'
      };
      
      const paths = extractor.flattenSchema(schema);
      
      expect(paths).toEqual(['user', 'user.name', 'user.email', 'active']);
    });

    it('should handle empty schema', () => {
      const schema: ExtractedSchema = {
        fields: [],
        rootType: 'object'
      };
      
      const paths = extractor.flattenSchema(schema);
      
      expect(paths).toEqual([]);
    });
  });
});
