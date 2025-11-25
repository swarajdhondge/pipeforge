/**
 * URL Security Utilities
 * 
 * Centralized security checks for URL validation across all fetch operators.
 * Implements private IP rejection, localhost blocking, and protocol validation.
 * 
 * Requirements: 17.1
 */

/**
 * Private IP ranges that should be blocked:
 * - 10.0.0.0/8 (Class A private)
 * - 172.16.0.0/12 (Class B private)
 * - 192.168.0.0/16 (Class C private)
 * - 169.254.0.0/16 (Link-local)
 * - 127.0.0.0/8 (Loopback)
 * - ::1 (IPv6 loopback)
 * - fc00::/7 (IPv6 unique local)
 * - fe80::/10 (IPv6 link-local)
 */

export interface URLSecurityResult {
  valid: boolean;
  error?: string;
}

/**
 * Check if an IP address is in a private range
 * @param hostname - The hostname to check
 * @returns True if the IP is private, false otherwise
 */
export function isPrivateIP(hostname: string): boolean {
  // Normalize hostname
  const normalizedHost = hostname.toLowerCase();

  // Block localhost variations
  if (normalizedHost === 'localhost' || normalizedHost === '127.0.0.1') {
    return true;
  }

  // Block IPv6 localhost
  if (normalizedHost === '::1' || normalizedHost === '[::1]') {
    return true;
  }

  // Block 127.x.x.x (loopback range)
  if (normalizedHost.startsWith('127.')) {
    return true;
  }

  // Block 10.0.0.0/8 (Class A private)
  if (normalizedHost.startsWith('10.')) {
    return true;
  }

  // Block 172.16.0.0/12 (Class B private: 172.16.x.x - 172.31.x.x)
  if (normalizedHost.startsWith('172.')) {
    const parts = normalizedHost.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (!isNaN(secondOctet) && secondOctet >= 16 && secondOctet <= 31) {
        return true;
      }
    }
  }

  // Block 192.168.0.0/16 (Class C private)
  if (normalizedHost.startsWith('192.168.')) {
    return true;
  }

  // Block 169.254.0.0/16 (Link-local / APIPA)
  if (normalizedHost.startsWith('169.254.')) {
    return true;
  }

  // Block 0.0.0.0 (unspecified address)
  if (normalizedHost === '0.0.0.0') {
    return true;
  }

  // Block IPv6 unique local addresses (fc00::/7)
  if (normalizedHost.startsWith('fc') || normalizedHost.startsWith('fd')) {
    // Check if it looks like an IPv6 address
    if (normalizedHost.includes(':')) {
      return true;
    }
  }

  // Block IPv6 link-local addresses (fe80::/10)
  if (normalizedHost.startsWith('fe80:') || normalizedHost.startsWith('[fe80:')) {
    return true;
  }

  return false;
}

/**
 * Validate a URL for security concerns
 * @param url - The URL to validate
 * @returns Validation result with error message if invalid
 */
export function validateURLSecurity(url: string): URLSecurityResult {
  try {
    const parsed = new URL(url);

    // Only allow HTTP and HTTPS protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: `Security error: Protocol "${parsed.protocol}" is not allowed. Only HTTP and HTTPS are permitted.`,
      };
    }

    // Check for private IP addresses
    if (isPrivateIP(parsed.hostname)) {
      return {
        valid: false,
        error: 'Security error: Private networks are not allowed',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Check if a URL is valid and safe for fetching
 * This is a convenience function that combines URL parsing and security validation
 * @param url - The URL to check
 * @returns True if the URL is valid and safe, false otherwise
 */
export function isValidAndSafeURL(url: string): boolean {
  return validateURLSecurity(url).valid;
}

/**
 * Generate test cases for private IP validation
 * Used for property-based testing
 */
export function generatePrivateIPTestCases(): string[] {
  return [
    // Localhost
    'localhost',
    '127.0.0.1',
    '127.0.0.2',
    '127.255.255.255',
    
    // IPv6 localhost
    '::1',
    '[::1]',
    
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
}

/**
 * Generate test cases for valid public IPs
 * Used for property-based testing
 */
export function generatePublicIPTestCases(): string[] {
  return [
    // Public IPs
    '8.8.8.8',
    '1.1.1.1',
    '208.67.222.222',
    '142.250.185.78',
    
    // Public domains
    'api.github.com',
    'jsonplaceholder.typicode.com',
    'example.com',
    'google.com',
    
    // Edge cases that should be allowed
    '172.15.0.1',  // Just below private range
    '172.32.0.1',  // Just above private range
    '192.167.1.1', // Not in 192.168.x.x
    '192.169.1.1', // Not in 192.168.x.x
  ];
}
