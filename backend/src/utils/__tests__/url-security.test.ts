import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isPrivateIP,
  validateURLSecurity,
  generatePublicIPTestCases,
} from '../url-security';
import { FetchOperator } from '../../operators/fetch-operator';
import { FetchJSONOperator } from '../../operators/sources/fetch-json-operator';
import { FetchCSVOperator } from '../../operators/sources/fetch-csv-operator';
import { FetchRSSOperator } from '../../operators/sources/fetch-rss-operator';
import { FetchPageOperator } from '../../operators/sources/fetch-page-operator';

/**
 * **Feature: pipe-forge-canvas, Property 22: Private IP Rejection**
 * **Validates: Requirements 17.1**
 * 
 * WHEN a Fetch operator URL points to localhost or private IP ranges
 * THEN the System SHALL reject the URL with "Security error: Private networks are not allowed"
 */
describe('Property 22: Private IP Rejection', () => {
  describe('isPrivateIP utility function', () => {
    /**
     * Property 22a: All localhost variations should be detected as private
     */
    it('Property 22a: should detect localhost variations as private', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('localhost', '127.0.0.1', '::1', '[::1]'),
          (hostname) => {
            return isPrivateIP(hostname) === true;
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * Property 22b: All 10.x.x.x addresses should be detected as private
     */
    it('Property 22b: should detect 10.x.x.x range as private', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([b, c, d]) => {
            const ip = `10.${b}.${c}.${d}`;
            return isPrivateIP(ip) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 22c: All 172.16-31.x.x addresses should be detected as private
     */
    it('Property 22c: should detect 172.16-31.x.x range as private', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 16, max: 31 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([b, c, d]) => {
            const ip = `172.${b}.${c}.${d}`;
            return isPrivateIP(ip) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 22d: All 192.168.x.x addresses should be detected as private
     */
    it('Property 22d: should detect 192.168.x.x range as private', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([c, d]) => {
            const ip = `192.168.${c}.${d}`;
            return isPrivateIP(ip) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 22e: 172.x.x.x addresses outside 16-31 range should NOT be private
     */
    it('Property 22e: should NOT detect 172.0-15.x.x and 172.32-255.x.x as private', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.oneof(
              fc.integer({ min: 0, max: 15 }),
              fc.integer({ min: 32, max: 255 })
            ),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([b, c, d]) => {
            const ip = `172.${b}.${c}.${d}`;
            return isPrivateIP(ip) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 22f: Link-local addresses (169.254.x.x) should be detected as private
     */
    it('Property 22f: should detect 169.254.x.x (link-local) as private', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([c, d]) => {
            const ip = `169.254.${c}.${d}`;
            return isPrivateIP(ip) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 22g: 127.x.x.x loopback range should be detected as private
     */
    it('Property 22g: should detect 127.x.x.x (loopback) as private', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([b, c, d]) => {
            const ip = `127.${b}.${c}.${d}`;
            return isPrivateIP(ip) === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validateURLSecurity function', () => {
    /**
     * Property 22h: URLs with private IPs should be rejected with correct error message
     */
    it('Property 22h: should reject private IP URLs with correct error message', () => {
      // Test IPv4 private IPs (excluding IPv6 which needs special URL formatting)
      const privateIPv4s = [
        // Localhost
        'localhost',
        '127.0.0.1',
        '127.0.0.2',
        '127.255.255.255',
        
        // 10.x.x.x range
        '10.0.0.0',
        '10.0.0.1',
        '10.255.255.255',
        '10.1.2.3',
        
        // 172.16-31.x.x range
        '172.16.0.0',
        '172.16.0.1',
        '172.31.255.255',
        '172.20.10.5',
        '172.24.100.200',
        
        // 192.168.x.x range
        '192.168.0.0',
        '192.168.0.1',
        '192.168.1.1',
        '192.168.255.255',
        '192.168.100.50',
        
        // Link-local
        '169.254.0.0',
        '169.254.1.1',
        '169.254.255.255',
        
        // Unspecified
        '0.0.0.0',
      ];
      
      for (const ip of privateIPv4s) {
        const url = `http://${ip}/api/data`;
        const result = validateURLSecurity(url);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Security error: Private networks are not allowed');
      }
      
      // Test IPv6 localhost with proper URL formatting
      const ipv6Localhost = 'http://[::1]/api/data';
      const ipv6Result = validateURLSecurity(ipv6Localhost);
      expect(ipv6Result.valid).toBe(false);
      expect(ipv6Result.error).toBe('Security error: Private networks are not allowed');
    });

    /**
     * Property 22i: URLs with public IPs/domains should be accepted
     */
    it('Property 22i: should accept public IP/domain URLs', () => {
      const publicHosts = generatePublicIPTestCases();
      
      for (const host of publicHosts) {
        const url = `https://${host}/api/data`;
        const result = validateURLSecurity(url);
        
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    /**
     * Property 22j: Non-HTTP/HTTPS protocols should be rejected
     */
    it('Property 22j: should reject non-HTTP/HTTPS protocols', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ftp:', 'file:', 'data:', 'javascript:', 'mailto:'),
          (protocol) => {
            const url = `${protocol}//example.com/data`;
            const result = validateURLSecurity(url);
            return result.valid === false && result.error?.includes('Protocol');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('All Fetch Operators - Private IP Rejection', () => {
    const fetchOperator = new FetchOperator();
    const fetchJSONOperator = new FetchJSONOperator();
    const fetchCSVOperator = new FetchCSVOperator();
    const fetchRSSOperator = new FetchRSSOperator();
    const fetchPageOperator = new FetchPageOperator();

    /**
     * Property 22k: All fetch operators should reject localhost URLs
     */
    it('Property 22k: all fetch operators should reject localhost URLs', () => {
      const localhostUrls = [
        'http://localhost/api',
        'http://localhost:3000/api',
        'http://127.0.0.1/api',
        'http://127.0.0.1:8080/api',
      ];

      for (const url of localhostUrls) {
        expect(fetchOperator.validate({ url }).valid).toBe(false);
        expect(fetchJSONOperator.validate({ url }).valid).toBe(false);
        expect(fetchCSVOperator.validate({ url }).valid).toBe(false);
        expect(fetchRSSOperator.validate({ url }).valid).toBe(false);
        expect(fetchPageOperator.validate({ url, selector: 'div' }).valid).toBe(false);
      }
    });

    /**
     * Property 22l: All fetch operators should reject 10.x.x.x private IPs
     */
    it('Property 22l: all fetch operators should reject 10.x.x.x private IPs', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([b, c, d]) => {
            const url = `http://10.${b}.${c}.${d}/api`;
            
            return (
              fetchOperator.validate({ url }).valid === false &&
              fetchJSONOperator.validate({ url }).valid === false &&
              fetchCSVOperator.validate({ url }).valid === false &&
              fetchRSSOperator.validate({ url }).valid === false &&
              fetchPageOperator.validate({ url, selector: 'div' }).valid === false
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property 22m: All fetch operators should reject 172.16-31.x.x private IPs
     */
    it('Property 22m: all fetch operators should reject 172.16-31.x.x private IPs', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 16, max: 31 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([b, c, d]) => {
            const url = `http://172.${b}.${c}.${d}/api`;
            
            return (
              fetchOperator.validate({ url }).valid === false &&
              fetchJSONOperator.validate({ url }).valid === false &&
              fetchCSVOperator.validate({ url }).valid === false &&
              fetchRSSOperator.validate({ url }).valid === false &&
              fetchPageOperator.validate({ url, selector: 'div' }).valid === false
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property 22n: All fetch operators should reject 192.168.x.x private IPs
     */
    it('Property 22n: all fetch operators should reject 192.168.x.x private IPs', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ),
          ([c, d]) => {
            const url = `http://192.168.${c}.${d}/api`;
            
            return (
              fetchOperator.validate({ url }).valid === false &&
              fetchJSONOperator.validate({ url }).valid === false &&
              fetchCSVOperator.validate({ url }).valid === false &&
              fetchRSSOperator.validate({ url }).valid === false &&
              fetchPageOperator.validate({ url, selector: 'div' }).valid === false
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property 22o: All fetch operators should accept valid public URLs
     */
    it('Property 22o: all fetch operators should accept valid public URLs', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
            fc.constantFrom('com', 'org', 'net', 'io', 'dev')
          ).map(([name, tld]) => `https://${name}.${tld}/api`),
          (url) => {
            return (
              fetchOperator.validate({ url }).valid === true &&
              fetchJSONOperator.validate({ url }).valid === true &&
              fetchCSVOperator.validate({ url }).valid === true &&
              fetchRSSOperator.validate({ url }).valid === true &&
              fetchPageOperator.validate({ url, selector: 'div' }).valid === true
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});


import { getDomainWhitelist } from '../domain-whitelist';

/**
 * **Feature: pipe-forge-canvas, Property 23: Domain Whitelist Enforcement**
 * **Validates: Requirements 17.2**
 * 
 * WHEN a Fetch operator URL is not in the domain whitelist
 * THEN the System SHALL reject with "Domain not whitelisted: [domain]"
 */
describe('Property 23: Domain Whitelist Enforcement', () => {
  const domainWhitelist = getDomainWhitelist();

  describe('DomainWhitelist class', () => {
    /**
     * Property 23a: Whitelisted domains should be allowed
     */
    it('Property 23a: should allow whitelisted domains', () => {
      const whitelist = domainWhitelist.getWhitelist();
      
      // All domains in the whitelist should be allowed
      for (const domain of whitelist) {
        const url = `https://${domain}/api/data`;
        expect(domainWhitelist.isAllowed(url)).toBe(true);
      }
    });

    /**
     * Property 23b: Non-whitelisted domains should be rejected
     */
    it('Property 23b: should reject non-whitelisted domains', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
            fc.constantFrom('xyz', 'test', 'fake', 'notreal')
          ).map(([name, tld]) => `${name}.${tld}`),
          (domain) => {
            // Skip if domain happens to be in whitelist
            const whitelist = domainWhitelist.getWhitelist();
            if (whitelist.includes(domain)) {
              return true;
            }
            
            const url = `https://${domain}/api/data`;
            return domainWhitelist.isAllowed(url) === false;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property 23c: Error message should include the rejected domain
     */
    it('Property 23c: error message should include rejected domain', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringMatching(/^[a-z][a-z0-9]{2,10}$/),
            fc.constantFrom('xyz', 'test', 'fake')
          ).map(([name, tld]) => `${name}.${tld}`),
          (domain) => {
            const url = `https://${domain}/api/data`;
            const errorMessage = domainWhitelist.getErrorMessage(url);
            
            // Error message should contain the domain
            return errorMessage.includes(domain);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property 23d: Only HTTP and HTTPS protocols should be allowed
     */
    it('Property 23d: should reject non-HTTP/HTTPS protocols', () => {
      const whitelist = domainWhitelist.getWhitelist();
      if (whitelist.length === 0) return;
      
      const domain = whitelist[0];
      
      // HTTP and HTTPS should be allowed (if domain is whitelisted)
      expect(domainWhitelist.isAllowed(`http://${domain}/api`)).toBe(true);
      expect(domainWhitelist.isAllowed(`https://${domain}/api`)).toBe(true);
      
      // Other protocols should be rejected
      expect(domainWhitelist.isAllowed(`ftp://${domain}/api`)).toBe(false);
      expect(domainWhitelist.isAllowed(`file://${domain}/api`)).toBe(false);
    });

    /**
     * Property 23e: Invalid URLs should be rejected
     */
    it('Property 23e: should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'http://',
        'https://',
        '',
        'javascript:alert(1)',
      ];
      
      for (const url of invalidUrls) {
        expect(domainWhitelist.isAllowed(url)).toBe(false);
      }
    });
  });

  describe('All Fetch Operators - Domain Whitelist Enforcement', () => {
    const fetchOperator = new FetchOperator();
    const fetchJSONOperator = new FetchJSONOperator();
    const fetchCSVOperator = new FetchCSVOperator();
    const fetchRSSOperator = new FetchRSSOperator();
    const fetchPageOperator = new FetchPageOperator();

    /**
     * Property 23f: All fetch operators should use domain whitelist during execution
     * This test verifies that operators throw errors for non-whitelisted domains
     */
    it('Property 23f: all fetch operators should reject non-whitelisted domains during execution', async () => {
      const nonWhitelistedUrl = 'https://definitely-not-whitelisted-domain.xyz/api';
      
      // FetchOperator
      await expect(
        fetchOperator.execute(null, { url: nonWhitelistedUrl })
      ).rejects.toThrow(/Domain not whitelisted/);
      
      // FetchJSONOperator
      await expect(
        fetchJSONOperator.execute(null, { url: nonWhitelistedUrl })
      ).rejects.toThrow(/Domain not whitelisted/);
      
      // FetchCSVOperator
      await expect(
        fetchCSVOperator.execute(null, { url: nonWhitelistedUrl })
      ).rejects.toThrow(/Domain not whitelisted/);
      
      // FetchRSSOperator
      await expect(
        fetchRSSOperator.execute(null, { url: nonWhitelistedUrl })
      ).rejects.toThrow(/Domain not whitelisted/);
      
      // FetchPageOperator
      await expect(
        fetchPageOperator.execute(null, { url: nonWhitelistedUrl, selector: 'div' })
      ).rejects.toThrow(/Domain not whitelisted/);
    });

    /**
     * Property 23g: Whitelist should be configurable via environment
     */
    it('Property 23g: whitelist should be loaded from configuration', () => {
      const whitelist = domainWhitelist.getWhitelist();
      
      // Whitelist should not be empty
      expect(whitelist.length).toBeGreaterThan(0);
      
      // Whitelist should contain expected default domains
      const expectedDefaults = [
        'api.github.com',
        'jsonplaceholder.typicode.com',
      ];
      
      for (const domain of expectedDefaults) {
        expect(whitelist).toContain(domain);
      }
    });
  });
});
