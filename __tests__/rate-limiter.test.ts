/**
 * Unit tests for rate limiting functionality
 */

import { checkRateLimit, getClientIP, isRateLimitingEnabled, isIPSafeListed } from '../libs/rate-limiter';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Rate Limiter', () => {
  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const config = { windowMs: 60000, maxRequests: 5, burstAllowance: 2 };
      
      // First request should be allowed
      const result1 = checkRateLimit('test-ip', config);
      expect(result1.allowed).toBe(true);
  // totalAllowed = 7; after 1 request remaining should be 6
  expect(result1.limit).toBe(7);
  expect(result1.remaining).toBe(6);
      
      // Second request should be allowed
      const result2 = checkRateLimit('test-ip', config);
      expect(result2.allowed).toBe(true);
  expect(result2.limit).toBe(7);
  expect(result2.remaining).toBe(5);
    });
    
    it('should block requests exceeding limit', () => {
      const config = { windowMs: 60000, maxRequests: 2, burstAllowance: 1 };
      
      // Use up all allowed requests
      checkRateLimit('test-ip-2', config); // 1st request
      checkRateLimit('test-ip-2', config); // 2nd request
      checkRateLimit('test-ip-2', config); // 3rd request (burst)
      
      // 4th request should be blocked
      const result = checkRateLimit('test-ip-2', config);
      expect(result.allowed).toBe(false);
  expect(result.limit).toBe(3);
  expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.remaining).toBe(0);
    });
    
    it('should reset limit after window expires', (done) => {
  const config = { windowMs: 100, maxRequests: 1 } as any; // 100ms window
      
      // Use up the limit
      const result1 = checkRateLimit('test-ip-3', config);
      expect(result1.allowed).toBe(true);
      
      const result2 = checkRateLimit('test-ip-3', config);
      expect(result2.allowed).toBe(false);
      
      // Wait for window to expire
      setTimeout(() => {
        const result3 = checkRateLimit('test-ip-3', config);
        expect(result3.allowed).toBe(true);
        done();
      }, 150);
    });
    
    it('should handle different identifiers separately', () => {
  const config = { windowMs: 60000, maxRequests: 1 } as any;
      
      const result1 = checkRateLimit('ip-1', config);
      expect(result1.allowed).toBe(true);
      
      const result2 = checkRateLimit('ip-2', config);
      expect(result2.allowed).toBe(true); // Different IP, should be allowed
      
      const result3 = checkRateLimit('ip-1', config);
      expect(result3.allowed).toBe(false); // Same IP, should be blocked
    });
  });
  
  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      });
      
      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.1');
    });
    
    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://example.com', {
        headers: { 'x-real-ip': '192.168.1.2' }
      });
      
      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.2');
    });

    it('should extract IP from cf-connecting-ip header', () => {
      const request = new Request('http://example.com', {
        headers: { 'cf-connecting-ip': '203.0.113.10' }
      });

      const ip = getClientIP(request);
      expect(ip).toBe('203.0.113.10');
    });

    it('should read NextRequest.ip when present', () => {
      const fakeReq: any = { ip: '10.1.2.3', headers: new Headers() };
      const ip = getClientIP(fakeReq);
      expect(ip).toBe('10.1.2.3');
    });
    
    it('should return unknown for missing headers', () => {
      const request = new Request('http://example.com');
      
      const ip = getClientIP(request);
      expect(ip).toBe('unknown');
    });
  });
  
  describe('isRateLimitingEnabled', () => {
    it('should be disabled by default in development', () => {
      // Create a new environment object to avoid readonly issues
      const testEnv: any = { ...process.env, NODE_ENV: 'development' };
      delete testEnv.ENABLE_RATE_LIMITING;
      
      // Mock process.env for this test
      const originalProcessEnv = process.env;
      (process as any).env = testEnv;
      
      const enabled = isRateLimitingEnabled();
      expect(enabled).toBe(false);
      
      // Restore original process.env
      (process as any).env = originalProcessEnv;
    });
    
    it('should be enabled when explicitly set in development', () => {
      const testEnv: any = { ...process.env, NODE_ENV: 'development', ENABLE_RATE_LIMITING: 'true' };
      
      const originalProcessEnv = process.env;
      (process as any).env = testEnv;
      
      const enabled = isRateLimitingEnabled();
      expect(enabled).toBe(true);
      
      (process as any).env = originalProcessEnv;
    });
    
    it('should be enabled by default in production', () => {
      const testEnv: any = { ...process.env, NODE_ENV: 'production' };
      delete testEnv.DISABLE_RATE_LIMITING;
      
      const originalProcessEnv = process.env;
      (process as any).env = testEnv;
      
      const enabled = isRateLimitingEnabled();
      expect(enabled).toBe(true);
      
      (process as any).env = originalProcessEnv;
    });
    
    it('should be disabled when explicitly set in production', () => {
      const testEnv: any = { ...process.env, NODE_ENV: 'production', DISABLE_RATE_LIMITING: 'true' };
      
      const originalProcessEnv = process.env;
      (process as any).env = testEnv;
      
      const enabled = isRateLimitingEnabled();
      expect(enabled).toBe(false);
      
      (process as any).env = originalProcessEnv;
    });
  });
  
  describe('isIPSafeListed', () => {
    it('should return false for non-safe-listed IPs', () => {
      delete process.env.RATE_LIMIT_SAFE_LIST;
      
      const isSafe = isIPSafeListed('192.168.1.1');
      expect(isSafe).toBe(false);
    });
    
    it('should return true for safe-listed IPs', () => {
      process.env.RATE_LIMIT_SAFE_LIST = '192.168.1.1,10.0.0.1';
      
      const isSafe1 = isIPSafeListed('192.168.1.1');
      expect(isSafe1).toBe(true);
      
      const isSafe2 = isIPSafeListed('10.0.0.1');
      expect(isSafe2).toBe(true);
      
      const isSafe3 = isIPSafeListed('192.168.1.2');
      expect(isSafe3).toBe(false);
    });
    
    it('should return true for wildcard safe list', () => {
      process.env.RATE_LIMIT_SAFE_LIST = '*';
      
      const isSafe = isIPSafeListed('any.ip.address');
      expect(isSafe).toBe(true);
    });
    
    it('should include localhost in preview environment', () => {
      process.env.VERCEL_ENV = 'preview';
      delete process.env.RATE_LIMIT_SAFE_LIST;
      
      const isSafe1 = isIPSafeListed('127.0.0.1');
      expect(isSafe1).toBe(true);
      
      const isSafe2 = isIPSafeListed('localhost');
      expect(isSafe2).toBe(true);
    });
  });
});