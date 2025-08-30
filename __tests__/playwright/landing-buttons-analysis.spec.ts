import { test, expect } from '@playwright/test';

const BASE_URL = 'https://padel-segria.vercel.app/';
const CLICKABLE_SELECTORS = [
  'a[href]:not([role="presentation"])',
  'button:not([disabled])',
  'input[type="button"]:not([disabled])',
  'input[type="submit"]:not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  'summary',
];

type ActionType = 'internal-nav' | 'external-nav' | 'modal' | 'request' | 'no-op' | 'unknown';

test.describe('Landing buttons analysis', () => {
  test.setTimeout(120000);
  test('classify click actions for landing clickables', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // auto-dismiss dialogs
    page.on('dialog', async (d) => d.dismiss().catch(() => {}));

    // get unique selectors and snippets in page context
    const clickables = await page.evaluate((selectors) => {
      function cssPath(el: Element): string {
        if (!(el instanceof Element)) return '';
        const parts: string[] = [];
        let node: Element | null = el;
        while (node && node.tagName.toLowerCase() !== 'html') {
          let part = node.tagName.toLowerCase();
          if (node.id) { part += `#${node.id}`; parts.unshift(part); break; }
          const parent = node.parentElement;
          if (parent) {
            const idx = Array.prototype.indexOf.call(parent.children, node) + 1;
            part += `:nth-child(${idx})`;
          }
          parts.unshift(part);
          node = node.parentElement;
        }
        return parts.join(' > ');
      }
      const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
      const out: { selector: string; snippet: string; href?: string }[] = [];
      const seen = new Set<string>();
      for (const n of nodes) {
        const style = window.getComputedStyle(n as Element);
        if (style && (style.display === 'none' || style.visibility === 'hidden')) continue;
        const rect = (n as Element).getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const selector = cssPath(n as Element);
        if (!selector) continue;
        const outer = (n as Element).outerHTML.replace(/\s+/g, ' ').slice(0, 200);
        if (seen.has(outer)) continue;
        seen.add(outer);
        const href = (n as HTMLAnchorElement).getAttribute ? (n as HTMLAnchorElement).getAttribute('href') : undefined;
        out.push({ selector, snippet: outer, href: href ?? undefined });
      }
      return out;
    }, CLICKABLE_SELECTORS);

    const results: Array<{ selector: string; snippet: string; href?: string; action: ActionType; note?: string }> = [];

    for (const c of clickables) {
      // Skip clearly external links for safety, but note them
      if (c.href && c.href.startsWith('http') && !c.href.startsWith(BASE_URL)) {
        results.push({ selector: c.selector, snippet: c.snippet, href: c.href, action: 'external-nav', note: 'skipped external' });
        continue;
      }

      // Ensure base
      try { await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 }); } catch {}

      const item = page.locator(c.selector).first();
      if (!(await item.isVisible())) {
        results.push({ selector: c.selector, snippet: c.snippet, href: c.href, action: 'no-op', note: 'not visible at click time' });
        continue;
      }

      // Observe navigation and network
      let navigatedTo = '';
      // typed helper to wait for navigation and return null on timeout/error
      const waitForNav: () => Promise<unknown> = async () => {
        try {
          return await page.waitForNavigation({ timeout: 3000 });
        } catch {
          return null;
        }
      };

      const [navigation] = await Promise.all([
        waitForNav(),
        (async () => {
          // Try clicking; if it throws, fallback to dispatch
          try {
            await item.click({ timeout: 3000 });
          } catch (e) {
            try {
              await item.evaluate((el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
            } catch {}
          }
        })(),
      ]);

      if (navigation) navigatedTo = page.url();

      // After click, try to detect modal presence by checking for aria-hidden/body overflow changes
      const modalPresent = await page.evaluate(() => {
        const mod = document.querySelector('[role="dialog"], .modal, [data-modal]');
        if (mod) return true;
        const overflow = window.getComputedStyle(document.body).overflow;
        return overflow === 'hidden' || overflow === 'clip';
      });

      let action: ActionType = 'unknown';
      let note: string | undefined;

      if (navigatedTo && navigatedTo.startsWith(BASE_URL)) {
        action = 'internal-nav';
        note = `navigated to ${navigatedTo}`;
      } else if (navigatedTo && !navigatedTo.startsWith(BASE_URL)) {
        action = 'external-nav';
        note = `navigated to external ${navigatedTo}`;
      } else if (modalPresent) {
        action = 'modal';
        note = 'modal detected after click';
      } else {
        // simple heuristic: did a fetch/XHR happen recently?
        const recentXhr = await page.evaluate(() => {
          // There is no straightforward cross-browser way here; try checking for active fetches by monkeypatch marker
          return (window as any).__playwright_recent_xhr ? true : false;
        });
        if (recentXhr) {
          action = 'request';
        } else {
          action = 'no-op';
        }
      }

      results.push({ selector: c.selector, snippet: c.snippet, href: c.href, action, note });
    }

    // Print summary to console and save as test info
    console.log('=== Landing clickables analysis ===');
    for (const r of results) console.log(JSON.stringify(r));

    // Basic assertion: at least one clickable found
    expect(results.length).toBeGreaterThan(0);
  });
});
