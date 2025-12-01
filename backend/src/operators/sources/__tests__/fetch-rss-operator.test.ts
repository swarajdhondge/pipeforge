import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FetchRSSOperator } from '../fetch-rss-operator';

describe('FetchRSSOperator', () => {
  const operator = new FetchRSSOperator();

  describe('normalizeItem() - RSS normalization', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 4: RSS Normalization**
     * **Validates: Requirements 3.3, 22.6**
     * 
     * For any RSS/Atom item, the normalized output SHALL always contain
     * exactly four fields: title, link, description, pubDate.
     * Missing optional fields SHALL be filled with empty string.
     */
    it('Property 4: RSS Normalization - output always has exactly four standard fields', () => {
      // Generate arbitrary RSS item objects with various field combinations
      const rssItem = fc.record({
        title: fc.option(fc.string(), { nil: undefined }),
        link: fc.option(fc.string(), { nil: undefined }),
        description: fc.option(fc.string(), { nil: undefined }),
        content: fc.option(fc.string(), { nil: undefined }),
        contentSnippet: fc.option(fc.string(), { nil: undefined }),
        summary: fc.option(fc.string(), { nil: undefined }),
        pubDate: fc.option(fc.string(), { nil: undefined }),
        isoDate: fc.option(fc.string(), { nil: undefined }),
        published: fc.option(fc.string(), { nil: undefined }),
        updated: fc.option(fc.string(), { nil: undefined }),
      }, { requiredKeys: [] });

      fc.assert(
        fc.property(rssItem, (item) => {
          const normalized = operator.normalizeItem(item);
          
          // Must have exactly these four keys
          const keys = Object.keys(normalized).sort();
          const expectedKeys = ['description', 'link', 'pubDate', 'title'];
          
          return JSON.stringify(keys) === JSON.stringify(expectedKeys);
        }),
        { numRuns: 100 }
      );
    });

    it('Property 4: RSS Normalization - missing fields are filled with empty string', () => {
      const rssItem = fc.record({
        title: fc.option(fc.string(), { nil: undefined }),
        link: fc.option(fc.string(), { nil: undefined }),
        description: fc.option(fc.string(), { nil: undefined }),
        pubDate: fc.option(fc.string(), { nil: undefined }),
      }, { requiredKeys: [] });

      fc.assert(
        fc.property(rssItem, (item) => {
          const normalized = operator.normalizeItem(item);
          
          // All fields must be strings (not null or undefined)
          return (
            typeof normalized.title === 'string' &&
            typeof normalized.link === 'string' &&
            typeof normalized.description === 'string' &&
            typeof normalized.pubDate === 'string'
          );
        }),
        { numRuns: 100 }
      );
    });

    it('Property 4: RSS Normalization - present fields are preserved', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (title, link, description, pubDate) => {
            const item = { title, link, description, pubDate };
            const normalized = operator.normalizeItem(item);
            
            return (
              normalized.title === title &&
              normalized.link === link &&
              normalized.description === description &&
              normalized.pubDate === pubDate
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 4: RSS Normalization - description fallback chain works correctly', () => {
      // Test that description falls back through: contentSnippet -> content -> summary -> description
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (descValue) => {
            // Test contentSnippet takes priority
            const item1 = { contentSnippet: descValue, content: 'other', summary: 'other2' };
            const norm1 = operator.normalizeItem(item1);
            
            // Test content is second priority
            const item2 = { content: descValue, summary: 'other' };
            const norm2 = operator.normalizeItem(item2);
            
            // Test summary is third priority
            const item3 = { summary: descValue };
            const norm3 = operator.normalizeItem(item3);
            
            return (
              norm1.description === descValue &&
              norm2.description === descValue &&
              norm3.description === descValue
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Property 4: RSS Normalization - pubDate fallback chain works correctly', () => {
      // Test that pubDate falls back through: pubDate -> isoDate -> published -> updated
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (dateValue) => {
            // Test pubDate takes priority
            const item1 = { pubDate: dateValue, isoDate: 'other', published: 'other2' };
            const norm1 = operator.normalizeItem(item1);
            
            // Test isoDate is second priority
            const item2 = { isoDate: dateValue, published: 'other' };
            const norm2 = operator.normalizeItem(item2);
            
            // Test published is third priority
            const item3 = { published: dateValue, updated: 'other' };
            const norm3 = operator.normalizeItem(item3);
            
            // Test updated is fourth priority
            const item4 = { updated: dateValue };
            const norm4 = operator.normalizeItem(item4);
            
            return (
              norm1.pubDate === dateValue &&
              norm2.pubDate === dateValue &&
              norm3.pubDate === dateValue &&
              norm4.pubDate === dateValue
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('normalizeItem() - edge cases', () => {
    it('should handle completely empty item', () => {
      const normalized = operator.normalizeItem({});
      
      expect(normalized).toEqual({
        title: '',
        link: '',
        description: '',
        pubDate: '',
      });
    });

    it('should handle null values', () => {
      const normalized = operator.normalizeItem({
        title: null,
        link: null,
        description: null,
        pubDate: null,
      });
      
      expect(normalized.title).toBe('');
      expect(normalized.link).toBe('');
      expect(normalized.description).toBe('');
      expect(normalized.pubDate).toBe('');
    });

    it('should handle undefined values', () => {
      const normalized = operator.normalizeItem({
        title: undefined,
        link: undefined,
      });
      
      expect(normalized.title).toBe('');
      expect(normalized.link).toBe('');
    });

    it('should preserve HTML in description', () => {
      const normalized = operator.normalizeItem({
        description: '<p>Hello <strong>World</strong></p>',
      });
      
      expect(normalized.description).toBe('<p>Hello <strong>World</strong></p>');
    });
  });

  describe('getOutputSchema()', () => {
    it('should return standard RSS schema', () => {
      const schema = operator.getOutputSchema();
      
      expect(schema).not.toBeNull();
      expect(schema!.rootType).toBe('array');
      expect(schema!.fields).toHaveLength(4);
      expect(schema!.fields.map(f => f.name)).toEqual(['title', 'link', 'description', 'pubDate']);
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
      const result = operator.validate({ url: 'http://localhost:3000/feed.xml' });
      expect(result.valid).toBe(false);
    });

    it('should reject private IP URLs', () => {
      const result = operator.validate({ url: 'http://192.168.1.1/feed.xml' });
      expect(result.valid).toBe(false);
    });

    it('should accept valid URLs', () => {
      const result = operator.validate({ url: 'https://example.com/feed.xml' });
      expect(result.valid).toBe(true);
    });

    it('should accept valid URLs with maxItems', () => {
      const result = operator.validate({ url: 'https://example.com/feed.xml', maxItems: 10 });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid maxItems', () => {
      const result = operator.validate({ url: 'https://example.com/feed.xml', maxItems: 0 });
      expect(result.valid).toBe(false);
    });

    it('should reject negative maxItems', () => {
      const result = operator.validate({ url: 'https://example.com/feed.xml', maxItems: -5 });
      expect(result.valid).toBe(false);
    });
  });
});
