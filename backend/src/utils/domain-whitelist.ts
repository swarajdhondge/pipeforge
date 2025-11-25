import { config } from '../config/env';

/**
 * DomainWhitelist - Validates URLs against approved domains
 * 
 * Features:
 * - Whitelist loaded from environment variable
 * - Default whitelist for common APIs
 * - Domain-level validation (allows all paths)
 * - Works alongside existing security checks (localhost/private IPs)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export class DomainWhitelist {
  private whitelist: Set<string>;

  constructor() {
    this.whitelist = this.loadWhitelist();

  }

  /**
   * Load whitelist from environment variable or use defaults
   * @returns Set of whitelisted domains
   */
  private loadWhitelist(): Set<string> {
    const domains = config.domainWhitelist;
    return new Set(domains.map(d => d.toLowerCase().trim()));
  }

  /**
   * Check if a URL is allowed by the whitelist
   * @param url - URL to validate
   * @returns True if allowed, false otherwise
   */
  isAllowed(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Only allow HTTP and HTTPS protocols
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      // Check if domain is in whitelist
      if (this.whitelist.has(hostname)) {
        return true;
      }

      // Check if any parent domain is in whitelist (for subdomains)
      // e.g., api.github.com allows api.github.com but not subdomain.api.github.com
      // This is intentionally strict - only exact matches allowed
      
      return false;

    } catch (error) {
      // Invalid URL format
      return false;
    }
  }

  /**
   * Get the current whitelist for display
   * @returns Array of whitelisted domains
   */
  getWhitelist(): string[] {
    return Array.from(this.whitelist).sort();
  }

  /**
   * Get a user-friendly error message for rejected domains
   * @param url - The rejected URL
   * @returns Error message with instructions
   */
  getErrorMessage(url: string): string {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      
      return `Domain not whitelisted: ${hostname}. Please contact support to request whitelist addition.`;
    } catch {
      return 'Invalid URL format';
    }
  }
}

// Singleton instance
let domainWhitelistInstance: DomainWhitelist | null = null;

/**
 * Get the singleton DomainWhitelist instance
 */
export function getDomainWhitelist(): DomainWhitelist {
  if (!domainWhitelistInstance) {
    domainWhitelistInstance = new DomainWhitelist();
  }
  return domainWhitelistInstance;
}
