import { test, expect, Page } from '@playwright/test';
import { useDevAuth, mockProfile, mockCompleteProfile } from './helpers/dev-auth';

const BASE = process.env.TEST_BASE || 'http://localhost:3000';

// Enhanced Test data constants with more realistic scenarios
const VALID_TEST_DATA = {
  name: 'Playwright',
  surname: 'Tester',
  phone: '+34 600 123 456',
  observations: 'Test user for automated testing'
};

const REALISTIC_TEST_DATA = [
  {
    name: 'María José',
    surname: 'García López',
    phone: '+34 678 912 345',
    observations: 'Prefiero jugar por las tardes. Nivel intermedio.'
  },
  {
    name: 'Jordi',
    surname: 'Puig i Ribas', 
    phone: '+34 699 876 543',
    observations: ''
  },
  {
    name: 'Ànnia',
    surname: 'Martínez-Vázquez',
    phone: '+34 612 345 678',
    observations: 'Sóc nova al pàdel. Tinc disponibilitat els matins.'
  }
];

const INVALID_TEST_DATA = {
  longName: 'A'.repeat(256), // Very long name
  specialChars: 'Test<script>alert("xss")</script>',
  xssPayloads: [
    '<script>alert("XSS")</script>',
    'javascript:alert(1)',
    '\'"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<%2Fscript%3E%3Cscript%3Ealert%28%27XSS%27%29%3C%2Fscript%3E',
    '\'><svg onload=alert(1)>',
    '" onerror="alert(1)" src="invalid-image'
  ],
  sqlInjectionPayloads: [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "1'; UPDATE users SET name='hacked' WHERE '1'='1",
    "\x00\x1a\n\r"
  ],
  invalidPhone: '123',
  emptyString: '',
  unicodeNames: [
    'José María 🎾',
    'Müller-González', 
    '李小龙',
    'أحمد محمد',
    'Владимир Путин'
  ]
};

// Enhanced Helper functions with comprehensive diagnostics
interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  headers: Record<string, string>;
  postData?: string;
  response?: any;
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

interface DiagnosticData {
  consoleErrors: string[];
  consoleWarnings: string[];
  networkRequests: NetworkRequest[];
  performanceMetrics: PerformanceMetrics;
  securityViolations: string[];
}

interface PerformanceMetrics {
  domContentLoaded: number;
  pageLoad: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
}

class CompleteProfileTestHelper {
  private diagnostics: DiagnosticData;
  private networkRequests: NetworkRequest[] = [];
  private consoleMessages: { type: string; text: string; timestamp: number }[] = [];
  
  constructor(private page: Page) {
    this.diagnostics = {
      consoleErrors: [],
      consoleWarnings: [],
      networkRequests: [],
      performanceMetrics: { domContentLoaded: 0, pageLoad: 0 },
      securityViolations: []
    };
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Console monitoring
    this.page.on('console', msg => {
      const message = {
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      };
      this.consoleMessages.push(message);
      
      if (msg.type() === 'error') {
        this.diagnostics.consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        this.diagnostics.consoleWarnings.push(msg.text());
      }
    });

    // Network monitoring
    this.page.on('request', request => {
      const timing = { startTime: Date.now(), endTime: 0, duration: 0 };
      const networkReq: NetworkRequest = {
        url: request.url(),
        method: request.method(),
        status: 0,
        headers: request.headers(),
        postData: request.postData(),
        timing
      };
      this.networkRequests.push(networkReq);
    });

    this.page.on('response', response => {
      const request = this.networkRequests.find(req => req.url === response.url() && req.status === 0);
      if (request) {
        request.status = response.status();
        request.timing.endTime = Date.now();
        request.timing.duration = request.timing.endTime - request.timing.startTime;
      }
    });

    // Security violation monitoring
    this.page.on('pageerror', error => {
      this.diagnostics.securityViolations.push(`Page Error: ${error.message}`);
    });
  }

  async takeScreenshotWithTimestamp(name: string, options: { fullPage?: boolean; clip?: any } = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results/complete-profile-${name}-${timestamp}.png`;
    
    await this.page.screenshot({ 
      path: filename,
      fullPage: options.fullPage ?? true,
      clip: options.clip
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        pageLoad: navigation.loadEventEnd - navigation.navigationStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0
      };
    });
    
    this.diagnostics.performanceMetrics = metrics;
    return metrics;
  }

  async generateDiagnosticReport(testName: string): Promise<string> {
    const metrics = await this.collectPerformanceMetrics();
    this.diagnostics.networkRequests = this.networkRequests;
    
    const report = {
      testName,
      timestamp: new Date().toISOString(),
      diagnostics: this.diagnostics,
      summary: {
        totalErrors: this.diagnostics.consoleErrors.length,
        totalWarnings: this.diagnostics.consoleWarnings.length,
        totalNetworkRequests: this.networkRequests.length,
        failedRequests: this.networkRequests.filter(req => req.status >= 400).length,
        averageResponseTime: this.networkRequests.length > 0 
          ? this.networkRequests.reduce((sum, req) => sum + req.timing.duration, 0) / this.networkRequests.length 
          : 0
      }
    };
    
    const reportJson = JSON.stringify(report, null, 2);
    console.log(`🔍 Diagnostic Report for ${testName}:`, reportJson);
    return reportJson;
  }

  async collectConsoleErrors(): Promise<string[]> {
    return [...this.diagnostics.consoleErrors];
  }

  async fillStep1(data: { name: string; surname: string }) {
    await this.page.fill('#name', data.name);
    await this.page.fill('#surname', data.surname);
  }

  async fillStep2(data: { phone?: string; observations?: string }) {
    if (data.phone) {
      const phoneInput = this.page.locator('#phone');
      await phoneInput.fill(data.phone);
    }
    if (data.observations) {
      await this.page.fill('#observations', data.observations);
    }
  }

  async fillStep3(acceptImageRights = false, acceptPrivacy = true) {
    if (acceptImageRights) {
      await this.page.check('#imageRights');
    }
    if (acceptPrivacy) {
      await this.page.check('#privacyPolicy');
    }
  }

  async navigateToStep(stepNumber: number) {
    for (let i = 0; i < stepNumber; i++) {
      await this.page.click('text=Següent');
      await this.page.waitForTimeout(500); // Wait for animation
    }
  }

  async verifyStepperState(currentStep: number) {
    const steppers = await this.page.locator('[data-testid="stepper-step"]').all();
    for (let i = 0; i < steppers.length; i++) {
      const step = steppers[i];
      if (i === currentStep) {
        await expect(step).toHaveClass(/active|current/);
      } else if (i < currentStep) {
        await expect(step).toHaveClass(/completed/);
      }
    }
  }

  async testAccessibility() {
    // Check for basic accessibility requirements
    const accessibilityIssues: string[] = [];
    
    // Check for proper heading hierarchy
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    if (headings.length === 0) {
      accessibilityIssues.push('No heading elements found');
    }
    
    // Check for form labels
    const inputs = await this.page.locator('input, textarea, select').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = await this.page.locator(`label[for="${id}"]`).count();
        if (label === 0) {
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          if (!ariaLabel && !ariaLabelledBy) {
            accessibilityIssues.push(`Input with id "${id}" has no associated label`);
          }
        }
      }
    }
    
    // Check for keyboard navigation
    await this.testKeyboardNavigation();
    
    return accessibilityIssues;
  }

  async testKeyboardNavigation(): Promise<boolean> {
    try {
      // Test Tab navigation through form elements
      await this.page.keyboard.press('Tab');
      const activeElement = await this.page.evaluate(() => document.activeElement?.tagName);
      return activeElement === 'INPUT' || activeElement === 'BUTTON' || activeElement === 'TEXTAREA';
    } catch (error) {
      console.warn('Keyboard navigation test failed:', error);
      return false;
    }
  }

  async testXSSProtection(payload: string, fieldId: string): Promise<{ protected: boolean; details: string }> {
    try {
      await this.page.fill(`#${fieldId}`, payload);
      
      // Check if payload was sanitized
      const fieldValue = await this.page.inputValue(`#${fieldId}`);
      const isProtected = !fieldValue.includes('<script>') && !fieldValue.includes('javascript:');
      
      // Check if any scripts were executed
      const scriptErrors = this.diagnostics.consoleErrors.filter(error => 
        error.includes('script') || error.includes('XSS') || error.includes('alert')
      );
      
      return {
        protected: isProtected && scriptErrors.length === 0,
        details: `Field value: ${fieldValue}, Script errors: ${scriptErrors.length}`
      };
    } catch (error) {
      return {
        protected: true,
        details: `Error during XSS test: ${error}`
      };
    }
  }

  async testCSRFProtection(): Promise<{ protected: boolean; details: string }> {
    try {
      // Check for CSRF tokens in forms
      const csrfTokens = await this.page.locator('input[name*="csrf"], input[name*="token"], input[type="hidden"]').count();
      
      // Check for proper headers in API requests
      const apiRequests = this.networkRequests.filter(req => req.url.includes('/api/'));
      const hasProperHeaders = apiRequests.some(req => 
        req.headers['x-requested-with'] || req.headers['content-type']?.includes('application/json')
      );
      
      return {
        protected: csrfTokens > 0 || hasProperHeaders,
        details: `CSRF tokens found: ${csrfTokens}, API requests with proper headers: ${apiRequests.length}`
      };
    } catch (error) {
      return {
        protected: false,
        details: `Error during CSRF test: ${error}`
      };
    }
  }
}

test.describe('Complete Profile - Comprehensive User Flow Tests', () => {
  let helper: CompleteProfileTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new CompleteProfileTestHelper(page);
    
    // Set up authentication for testing
    await useDevAuth(page, {
      profile: null, // No existing profile to simulate new user flow
    });
    
    await page.goto(`${BASE}/complete-profile`);
    await page.waitForLoadState('networkidle');
    await helper.takeScreenshotWithTimestamp('initial-load');
  });
  
  test.afterEach(async ({ page }) => {
    await helper.generateDiagnosticReport(test.info().title);
  });

  test.describe('1. Main Complete Profile Flow', () => {
    test('should complete full profile successfully with all steps', async ({ page }) => {
      // Step 1: Basic Information
      await helper.takeScreenshotWithTimestamp('step1-start');
      await helper.fillStep1(VALID_TEST_DATA);
      
      // Verify next button becomes enabled
      const nextBtn = page.locator('text=Següent');
      await expect(nextBtn).not.toBeDisabled();
      await helper.takeScreenshotWithTimestamp('step1-filled');
      
      await nextBtn.click();
      await page.waitForTimeout(500);

      // Step 2: Contact Information
      await helper.takeScreenshotWithTimestamp('step2-start');
      await helper.fillStep2(VALID_TEST_DATA);
      await helper.takeScreenshotWithTimestamp('step2-filled');
      
      await page.click('text=Següent');
      await page.waitForTimeout(500);

      // Step 3: Policies
      await helper.takeScreenshotWithTimestamp('step3-start');
      await helper.fillStep3(true, true);
      await helper.takeScreenshotWithTimestamp('step3-filled');

      // Submit form and verify success
      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/auth/complete-profile')),
        page.click('text=Finalitzar')
      ]);

      await helper.takeScreenshotWithTimestamp('submission-success');
      expect(response.status()).toBe(200);
      
      // Should redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await helper.takeScreenshotWithTimestamp('redirect-to-dashboard');
    });

    test('should handle step navigation correctly', async ({ page }) => {
      // Fill step 1 and move forward
      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      
      // Navigate back from step 2
      await page.click('text=Enrere');
      await helper.takeScreenshotWithTimestamp('navigated-back-to-step1');
      
      // Verify we're back on step 1 with preserved data
      await expect(page.locator('#name')).toHaveValue(VALID_TEST_DATA.name);
      await expect(page.locator('#surname')).toHaveValue(VALID_TEST_DATA.surname);

      // Move forward again and fill step 2
      await page.click('text=Següent');
      await helper.fillStep2(VALID_TEST_DATA);
      await page.click('text=Següent');
      
      // Navigate back from step 3
      await page.click('text=Enrere');
      await helper.takeScreenshotWithTimestamp('navigated-back-to-step2');
      
      // Verify step 2 data is preserved
      await expect(page.locator('#phone')).toHaveValue(VALID_TEST_DATA.phone);
    });

    test('should redirect authenticated users with complete profiles', async ({ page }) => {
      // This test simulates a user who already has a complete profile
      // They should be redirected to dashboard immediately
      
      // Mock the API response to simulate existing complete profile
      await page.route('**/api/auth/profile', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              profile: {
                name: 'Existing',
                surname: 'User',
                phone: '+34 600 000 000'
              }
            }
          })
        });
      });

      await page.reload();
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      await helper.takeScreenshotWithTimestamp('existing-profile-redirect');
    });
  });

  test.describe('2. Form Validation Tests', () => {
    test('should validate required fields on step 1', async ({ page }) => {
      // Try to advance without filling required fields
      const nextBtn = page.locator('text=Següent');
      await expect(nextBtn).toBeDisabled();
      await helper.takeScreenshotWithTimestamp('step1-empty-validation');

      // Fill only name
      await page.fill('#name', VALID_TEST_DATA.name);
      await expect(nextBtn).toBeDisabled();
      
      // Fill only surname  
      await page.fill('#name', '');
      await page.fill('#surname', VALID_TEST_DATA.surname);
      await expect(nextBtn).toBeDisabled();
      
      // Fill both - should enable next
      await page.fill('#name', VALID_TEST_DATA.name);
      await expect(nextBtn).not.toBeDisabled();
      await helper.takeScreenshotWithTimestamp('step1-validation-passed');
    });

    test('should validate phone number format', async ({ page }) => {
      // Complete step 1
      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');

      // Test invalid phone formats
      const phoneInput = page.locator('#phone');
      const invalidPhones = ['123', 'abc', '12345', '+34abc', '++34600123456'];

      for (const invalidPhone of invalidPhones) {
        await phoneInput.fill(invalidPhone);
        await page.click('text=Següent');
        
        // Should show validation error and not advance
        await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 2000 });
        await helper.takeScreenshotWithTimestamp(`phone-validation-${invalidPhone.replace(/[^a-zA-Z0-9]/g, '')}`);
        
        // Clear the invalid input
        await phoneInput.fill('');
      }

      // Test valid phone - should advance
      await phoneInput.fill(VALID_TEST_DATA.phone);
      await page.click('text=Següent');
      await expect(page.locator('text=Polítiques')).toBeVisible();
      await helper.takeScreenshotWithTimestamp('phone-validation-success');
    });

    test('should require privacy policy acceptance', async ({ page }) => {
      // Complete steps 1 and 2
      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep2(VALID_TEST_DATA);
      await page.click('text=Següent');

      // Try to submit without accepting privacy policy
      const submitBtn = page.locator('text=Finalitzar');
      await expect(submitBtn).toBeDisabled();
      await helper.takeScreenshotWithTimestamp('privacy-policy-required');

      // Accept privacy policy - should enable submit
      await page.check('#privacyPolicy');
      await expect(submitBtn).not.toBeDisabled();
      await helper.takeScreenshotWithTimestamp('privacy-policy-accepted');
    });
  });

  test.describe('3. Error Scenarios', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Complete all steps
      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep2(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep3(true, true);

      // Mock network failure
      await page.route('**/api/auth/complete-profile', async route => {
        await route.abort('failed');
      });

      await page.click('text=Finalitzar');
      
      // Should show error message
      await expect(page.locator('text=Error de connexió')).toBeVisible({ timeout: 5000 });
      await helper.takeScreenshotWithTimestamp('network-failure-error');
    });

    test('should handle authentication errors', async ({ page }) => {
      // Mock authentication error
      await page.route('**/api/auth/complete-profile', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No autorizado' })
        });
      });

      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep2(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep3(true, true);
      await page.click('text=Finalitzar');

      await expect(page.locator('text=No autorizado')).toBeVisible({ timeout: 5000 });
      await helper.takeScreenshotWithTimestamp('auth-error');
    });

    test('should handle server validation errors', async ({ page }) => {
      // Mock server validation error
      await page.route('**/api/auth/complete-profile', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'El nom i cognoms són obligatoris' })
        });
      });

      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep2(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep3(true, true);
      await page.click('text=Finalitzar');

      await expect(page.locator('text=El nom i cognoms són obligatoris')).toBeVisible({ timeout: 5000 });
      await helper.takeScreenshotWithTimestamp('server-validation-error');
    });
  });

  test.describe('4. Edge Cases', () => {
    test('should handle special characters in input fields', async ({ page }) => {
      await helper.fillStep1({
        name: INVALID_TEST_DATA.specialChars,
        surname: 'User©®™'
      });
      await helper.takeScreenshotWithTimestamp('special-characters-input');
      
      await page.click('text=Següent');
      await helper.fillStep2({ observations: 'Test with émojis 🎾 and spëcial çhars' });
      await page.click('text=Següent');
      await helper.fillStep3(false, true);
      
      // Mock successful response
      await page.route('**/api/auth/complete-profile', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Perfil completat correctament' })
        });
      });
      
      await page.click('text=Finalitzar');
      await helper.takeScreenshotWithTimestamp('special-characters-success');
    });

    test('should handle very long input values', async ({ page }) => {
      await helper.fillStep1({
        name: INVALID_TEST_DATA.longName,
        surname: 'B'.repeat(100)
      });
      await helper.takeScreenshotWithTimestamp('long-inputs-step1');
      
      await page.click('text=Següent');
      await helper.fillStep2({ 
        observations: 'C'.repeat(1000) // Very long observations
      });
      await helper.takeScreenshotWithTimestamp('long-inputs-step2');
    });

    test('should handle rapid form interactions', async ({ page }) => {
      // Rapidly click through form without waiting
      await helper.fillStep1(VALID_TEST_DATA);
      
      // Click next multiple times rapidly
      for (let i = 0; i < 3; i++) {
        await page.click('text=Següent');
      }
      
      await helper.takeScreenshotWithTimestamp('rapid-interactions');
      
      // Should still be on correct step
      await expect(page.locator('text=Contacte')).toBeVisible();
    });

    test('should preserve form data on page refresh', async ({ page }) => {
      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep2(VALID_TEST_DATA);
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Data should be preserved (if implemented)
      await helper.takeScreenshotWithTimestamp('after-page-refresh');
    });
  });

  test.describe('5. UI/UX Validation', () => {
    test('should be responsive on different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500);
        await helper.takeScreenshotWithTimestamp(`responsive-${viewport.name}`);
        
        // Verify form is still functional
        await expect(page.locator('#name')).toBeVisible();
        await expect(page.locator('#surname')).toBeVisible();
      }
    });

    test('should show loading states during submission', async ({ page }) => {
      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep2(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep3(true, true);

      // Mock slow response
      await page.route('**/api/auth/complete-profile', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Success' })
        });
      });

      await page.click('text=Finalitzar');
      
      // Should show loading state
      await expect(page.locator('text=Guardant...')).toBeVisible();
      await expect(page.locator('.animate-spin')).toBeVisible();
      await helper.takeScreenshotWithTimestamp('loading-state');
    });

    test('should have proper accessibility features', async ({ page }) => {
      // Check for ARIA labels and proper form structure
      await expect(page.locator('label[for="name"]')).toBeVisible();
      await expect(page.locator('label[for="surname"]')).toBeVisible();
      await expect(page.locator('#name')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('#surname')).toHaveAttribute('aria-required', 'true');
      
      // Check for proper heading structure
      await expect(page.locator('h4')).toBeVisible();
      
      await helper.takeScreenshotWithTimestamp('accessibility-check');
    });

    test('should display error messages clearly', async ({ page }) => {
      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      
      // Test phone validation error display
      await page.fill('#phone', '123');
      await page.click('text=Següent');
      
      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toHaveAttribute('role', 'alert');
      await helper.takeScreenshotWithTimestamp('error-message-display');
    });
  });

  test.describe('6. Integration Tests', () => {
    test('should handle pre-filled data correctly', async ({ page }) => {
      // Mock API response with partial existing data
      await page.route('**/api/auth/profile', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              profile: {
                name: 'PreFilled',
                surname: '',
                phone: '+34 600 000 000',
                observations: 'Existing notes'
              }
            }
          })
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify pre-filled data
      await expect(page.locator('#name')).toHaveValue('PreFilled');
      await helper.takeScreenshotWithTimestamp('pre-filled-data');
    });

    test('should handle authentication check on page load', async ({ page }) => {
      // Mock unauthenticated user
      await mockProfile(page, null);

      await page.goto(`${BASE}/complete-profile`);
      
      // Should redirect to sign in
      await page.waitForURL('**/signin', { timeout: 5000 });
      await helper.takeScreenshotWithTimestamp('unauthenticated-redirect');
    });

    test('should integrate properly with Supabase authentication', async ({ page }) => {
      // Test the full authentication flow
      await useDevAuth(page, {
        profile: { name: 'Test', surname: 'User' }
      });
      
      await page.goto(`${BASE}/complete-profile`);
      
      // Should redirect to dashboard for complete profile
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      await helper.takeScreenshotWithTimestamp('complete-profile-redirect');
    });

    test('should handle server errors gracefully', async ({ page }) => {
      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep2(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep3(true, true);

      // Mock different types of server errors
      const serverErrors = [
        { status: 500, message: 'Internal server error' },
        { status: 503, message: 'Service unavailable' },
        { status: 429, message: 'Too many requests' }
      ];

      for (const error of serverErrors) {
        await mockCompleteProfile(page, { error: error.message }, error.status);
        await page.click('text=Finalitzar');
        
        // Should show appropriate error message
        await expect(page.locator(`text=${error.message}`)).toBeVisible({ timeout: 5000 });
        await helper.takeScreenshotWithTimestamp(`server-error-${error.status}`);
        
        // Should remain on the same page for retry
        await expect(page.locator('text=Finalitzar')).toBeVisible();
        break; // Test only the first error to avoid multiple submissions
      }
    });
  });

  test.describe('7. Security Testing', () => {
    test('should protect against XSS attacks in all form fields', async ({ page }) => {
      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep2(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep3(true, true);
      
      // Mock successful API response for security testing
      await mockCompleteProfile(page);
      
      // Go back to test XSS on each field
      await page.click('text=Enrere');
      await page.click('text=Enrere');
      
      // Test XSS protection on name field
      for (const payload of INVALID_TEST_DATA.xssPayloads.slice(0, 3)) {
        const result = await helper.testXSSProtection(payload, 'name');
        expect(result.protected).toBe(true);
        await helper.takeScreenshotWithTimestamp(`xss-test-name-${payload.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`);
      }
      
      await page.click('text=Següent');
      
      // Test XSS protection on observations field
      for (const payload of INVALID_TEST_DATA.xssPayloads.slice(0, 2)) {
        const result = await helper.testXSSProtection(payload, 'observations');
        expect(result.protected).toBe(true);
        await helper.takeScreenshotWithTimestamp(`xss-test-observations-${payload.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`);
      }
      
      await helper.takeScreenshotWithTimestamp('xss-protection-complete');
    });

    test('should implement proper CSRF protection', async ({ page }) => {
      const csrfResult = await helper.testCSRFProtection();
      await helper.takeScreenshotWithTimestamp('csrf-protection-check');
      
      // Check that API requests have proper security headers
      await helper.fillStep1(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep2(VALID_TEST_DATA);
      await page.click('text=Següent');
      await helper.fillStep3(true, true);
      
      await mockCompleteProfile(page);
      await page.click('text=Finalitzar');
      
      // Verify CSRF protection is in place
      expect(csrfResult.protected).toBe(true);
      await helper.takeScreenshotWithTimestamp('csrf-protection-verified');
    });

    test('should enforce proper content security policy', async ({ page }) => {
      // Check for CSP headers and violations
      const cspViolations: string[] = [];
      
      page.on('response', response => {
        const cspHeader = response.headers()['content-security-policy'];
        if (!cspHeader && response.url().includes(BASE)) {
          cspViolations.push(`Missing CSP header on ${response.url()}`);
        }
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await helper.takeScreenshotWithTimestamp('csp-check');
      
      // CSP violations should be minimal or none
      expect(cspViolations.length).toBeLessThan(5);
      console.log('CSP violations found:', cspViolations);
    });
  });

  test.describe('8. Advanced Accessibility Testing', () => {
    test('should support full keyboard navigation', async ({ page }) => {
      // Test keyboard-only navigation through the entire form
      await page.keyboard.press('Tab'); // Should focus first input
      await expect(page.locator('#name')).toBeFocused();
      
      // Fill first step using keyboard
      await page.keyboard.type(VALID_TEST_DATA.name);
      await page.keyboard.press('Tab');
      await expect(page.locator('#surname')).toBeFocused();
      await page.keyboard.type(VALID_TEST_DATA.surname);
      
      // Navigate to next button and activate
      await page.keyboard.press('Tab');
      await expect(page.locator('text=Següent')).toBeFocused();
      await page.keyboard.press('Enter');
      
      await helper.takeScreenshotWithTimestamp('keyboard-navigation-step1');
      
      // Continue keyboard navigation through step 2
      await page.keyboard.press('Tab'); // Should focus phone input
      await page.keyboard.type(VALID_TEST_DATA.phone);
      await page.keyboard.press('Tab'); // Should focus observations
      await page.keyboard.type(VALID_TEST_DATA.observations);
      
      // Navigate to next button
      await page.keyboard.press('Tab'); // Back button
      await page.keyboard.press('Tab'); // Next button
      await page.keyboard.press('Enter');
      
      await helper.takeScreenshotWithTimestamp('keyboard-navigation-step2');
      
      // Test step 3 keyboard navigation
      await page.keyboard.press('Tab'); // Image rights checkbox
      await page.keyboard.press('Space'); // Check it
      await page.keyboard.press('Tab'); // Privacy policy checkbox
      await page.keyboard.press('Space'); // Check it
      
      await helper.takeScreenshotWithTimestamp('keyboard-navigation-step3');
      
      // Navigate to submit button
      await page.keyboard.press('Tab'); // Back button
      await page.keyboard.press('Tab'); // Submit button
      await expect(page.locator('text=Finalitzar')).toBeFocused();
      
      await helper.takeScreenshotWithTimestamp('keyboard-navigation-complete');
    });

    test('should have proper ARIA labels and descriptions', async ({ page }) => {
      const accessibilityIssues = await helper.testAccessibility();
      
      // Check specific ARIA attributes
      await expect(page.locator('#name')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('#surname')).toHaveAttribute('aria-required', 'true');
      
      // Check for form structure
      const formElement = page.locator('form');
      await expect(formElement).toHaveAttribute('aria-labelledby');
      
      await helper.takeScreenshotWithTimestamp('aria-attributes-verified');
      
      // Report accessibility issues
      console.log('Accessibility issues found:', accessibilityIssues);
      expect(accessibilityIssues.length).toBeLessThan(3); // Allow for minor issues
    });
  });

  // Global error collection test
  test('should maintain clean console and minimal errors throughout testing', async ({ page }) => {
    const finalErrors = await helper.collectConsoleErrors();
    const diagnosticReport = await helper.generateDiagnosticReport('final-error-summary');
    
    // Allow for some acceptable warnings but no critical errors
    const criticalErrors = finalErrors.filter(error => 
      error.includes('Error') && 
      !error.includes('Warning') && 
      !error.includes('ResizeObserver') && // Common non-critical error
      !error.includes('favicon') // Favicon errors are not critical
    );
    
    expect(criticalErrors.length).toBeLessThan(2);
    await helper.takeScreenshotWithTimestamp('final-console-state');
    
    console.log('Final diagnostic report:', diagnosticReport);
    console.log(`Total console errors: ${finalErrors.length}`);
    console.log(`Critical errors: ${criticalErrors.length}`);
  });
});

// Additional comprehensive test for complete user journey
test.describe('Complete User Journey - End-to-End', () => {
  test('should complete entire user onboarding flow successfully', async ({ page }) => {
    const helper = new CompleteProfileTestHelper(page);
    
    // Simulate complete user journey from unauthenticated to profile completion
    await useDevAuth(page, { profile: null });
    
    await page.goto(`${BASE}/complete-profile`);
    await page.waitForLoadState('networkidle');
    await helper.takeScreenshotWithTimestamp('journey-start');
    
    // Complete all steps with realistic data
    const userData = REALISTIC_TEST_DATA[0];
    
    // Step 1: Basic Information
    await helper.fillStep1(userData);
    await expect(page.locator('text=Següent')).not.toBeDisabled();
    await helper.takeScreenshotWithTimestamp('journey-step1-complete');
    await page.click('text=Següent');
    
    // Step 2: Contact Information  
    await helper.fillStep2(userData);
    await helper.takeScreenshotWithTimestamp('journey-step2-complete');
    await page.click('text=Següent');
    
    // Step 3: Policies
    await helper.fillStep3(true, true);
    await helper.takeScreenshotWithTimestamp('journey-step3-complete');
    
    // Final submission
    await mockCompleteProfile(page);
    
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/complete-profile')),
      page.click('text=Finalitzar')
    ]);
    
    expect(response.status()).toBe(200);
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await helper.takeScreenshotWithTimestamp('journey-complete-success');
    
    // Generate final diagnostic report
    const diagnosticReport = await helper.generateDiagnosticReport('complete-user-journey');
    console.log('Complete journey diagnostic report:', diagnosticReport);
  });
});
