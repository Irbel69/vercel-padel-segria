import { test, expect } from '@playwright/test';

const BASE_URL = 'https://padel-segria.vercel.app/';

// Helper: get clickable elements selector list
const CLICKABLE_SELECTORS = [
  'a[href]:not([role="presentation"])',
  'button:not([disabled])',
  'input[type="button"]:not([disabled])',
  'input[type="submit"]:not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  'summary',
];

test.describe('Landing page clickable elements', () => {
  test.setTimeout(120000);
  test('click all visible clickables without throwing', async ({ page }) => {
    const errors: Array<{ locator: string; message: string }> = [];

    // Intercept dialogs to automatically dismiss
    page.on('dialog', async (dialog) => {
      try {
        await dialog.dismiss();
      } catch (e) {
        // ignore
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Build a list of unique CSS selectors for visible clickable elements in-page.
    const clickables: { selector: string; snippet: string; href?: string }[] = await page.evaluate((selectors) => {
      // helper to build a unique-ish CSS selector for an element
      function cssPath(el: Element): string {
        if (!(el instanceof Element)) return '';
        const parts: string[] = [];
        let node: Element | null = el;
        while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
          let part = node.tagName.toLowerCase();
          if (node.id) {
            part += `#${node.id}`;
            parts.unshift(part);
            break;
          } else {
            // add nth-child to be more specific
            const parent = node.parentElement;
            if (parent) {
              const sameTagSiblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
              if (sameTagSiblings.length > 1) {
                const idx = Array.prototype.indexOf.call(parent.children, node) + 1;
                part += `:nth-child(${idx})`;
              }
            }
          }
          parts.unshift(part);
          node = node.parentElement;
        }
        return parts.join(' > ');
      }

      const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
      const seen = new Set<string>();
      const out: { selector: string; snippet: string; href?: string }[] = [];
      for (const n of nodes) {
        // check visible-ish
        const style = window.getComputedStyle(n as Element);
        if (style && (style.visibility === 'hidden' || style.display === 'none')) continue;
        const rect = (n as Element).getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        const selector = cssPath(n as Element);
        if (!selector) continue;
        let outer = '';
        try {
          outer = (n as Element).outerHTML.replace(/\s+/g, ' ').slice(0, 200);
        } catch {
          outer = selector;
        }
        if (seen.has(outer)) continue;
        seen.add(outer);
        const href = (n as HTMLAnchorElement).getAttribute ? (n as HTMLAnchorElement).getAttribute('href') : undefined;
        out.push({ selector, snippet: outer, href: href ?? undefined });
      }
      return out;
    }, CLICKABLE_SELECTORS);

    console.log(`Found ${clickables.length} clickable elements (unique selectors)`);

    for (const c of clickables) {
      // skip external links
      if (c.href && c.href.startsWith('http') && !c.href.startsWith(BASE_URL)) {
        console.log(`Skipping external link (pre-filter): ${c.href}`);
        continue;
      }

      // Ensure we're on the base page before each click
      try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
      } catch {
        try {
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
        } catch {}
      }

      try {
        const item = page.locator(c.selector).first();
        if (!(await item.isVisible())) {
          console.log(`Element not visible at click time, skipping: ${c.snippet}`);
          continue;
        }

        await item.scrollIntoViewIfNeeded();

        // click and handle navigation/dialogs
        try {
          await item.click({ timeout: 8000 });
        } catch (clickErr) {
          try {
            await item.evaluate((el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
          } catch (evErr) {
            throw clickErr;
          }
        }

        await page.waitForTimeout(900);

        const current = page.url();
        if (current.startsWith('http') && !current.startsWith(BASE_URL)) {
          console.log(`Clicked element navigated away to ${current}, returning to base`);
          try {
            await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
          } catch {
            try {
              await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
            } catch {
              await page.goto(BASE_URL, { timeout: 10000 }).catch(() => {});
            }
          }
        }
      } catch (e: any) {
        errors.push({ locator: c.selector + ' | ' + c.snippet, message: String(e.message ?? e) });
      }
    }
  if (errors.length > 0) {
      for (const err of errors) {
        console.error(`Failure for element: ${err.locator}\n  ${err.message}`);
      }
    }

    expect(errors.length).toBe(0);
  });
});
