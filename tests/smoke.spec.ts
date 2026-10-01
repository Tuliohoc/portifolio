import { test, expect, type Page } from '@playwright/test';

const heading = (page: Page, id: string) =>
  page.locator(`#${id} h1, #${id} h2`).first();

/* Every entry point to the Test Lab points at the same published address: the
   screen itself is not part of this site any more. */
const TEST_LAB = 'https://tuliohoc.github.io/academybugs-tests-/';

test.describe('home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders without javascript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      // Web fonts come from a third party. A network hiccup fetching them is not
      // a defect in this page, and asserting on it would make the test flaky.
      const isThirdPartyResource = message.text().includes('Failed to load resource');
      if (message.type() === 'error' && !isThirdPartyResource) errors.push(message.text());
    });

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Tulio Ramos' })).toBeVisible();
    // the name is animated letter by letter, and the space between words has to survive that
    await expect(page.locator('#name')).toHaveText('Tulio Ramos');
    await expect(page.locator('#role')).toHaveText('QA Engineer');
    await expect(page.locator('#headline')).toContainText('Test Automation');
    await expect(page.locator('.avatar img').first()).toBeVisible();
    await expect(page.locator('.bar .mark')).toContainText('TULIO');
    expect(errors).toEqual([]);
  });

  test('the hero says what he does and where he works now', async ({ page }) => {
    await expect(page.locator('.hero-cta a[href="#testlab"]')).toContainText('Explore My Tests');
    await expect(page.locator('.hero-cta a[href="#projects"]')).toContainText('View Projects');
    await expect(page.locator('.hero-status')).toContainText('Currently working with QA');
  });

  for (const width of [375, 320]) {
    test(`the name never breaks inside a word on a ${width}px phone`, async ({ page }) => {
      await page.setViewportSize({ width, height: 667 });
      await page.reload();
      await page.evaluate(() => document.fonts.ready);

      const linesPerWord = await page.locator('#name').evaluate((name) => {
        const letters = [...name.querySelectorAll<HTMLElement>('.ch')];
        const words = (name.textContent ?? '').trim().split(/\s+/);
        let at = 0;
        return words.map((word) => {
          const tops = letters.slice(at, (at += word.length)).map((letter) => letter.offsetTop);
          return new Set(tops).size;
        });
      });
      expect(linesPerWord).toEqual([1, 1]);
    });
  }

  test('in page navigation reaches every section', async ({ page }) => {
    for (const section of ['home', 'about', 'experience', 'projects', 'contact']) {
      await page.locator(`.nav a[href="#${section}"]`).click();
      await expect(heading(page, section)).toBeInViewport({ timeout: 10_000 });
    }
    // the Test Lab item leaves the site: the screen is published elsewhere
    await expect(page.locator('.nav a[data-i18n="nav.lab"]')).toHaveAttribute('href', TEST_LAB);
    await expect(page.locator('.nav a[data-i18n="nav.lab"]')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('the Test Lab link in the navigation points at the deployed lab', async ({ page }) => {
    await page.route('https://tuliohoc.github.io/**', route =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>lab</title>' }),
    );
    const lab = page.locator('.nav a').filter({ hasText: 'Test Lab' });
    await expect(lab).toHaveAttribute('href', 'https://tuliohoc.github.io/academybugs-tests-/');
    await expect(page.locator('.nav a[href="#testlab"]')).toHaveCount(0);
    await lab.click();
    await page.waitForURL('https://tuliohoc.github.io/academybugs-tests-/');
  });

  test('Home brings the page back to the very top', async ({ page }) => {
    await page.locator('.nav a[href="#about"]').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
    await page.locator('.nav a[href="#home"]').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
  });

  test('the experience timeline opens each role', async ({ page }) => {
    await page.locator('#experience').scrollIntoViewIfNeeded();

    const playpag = page.locator('#jobh-playpag');
    await expect(playpag).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#job-playpag')).toContainText('Cypress and Playwright');

    const right = page.locator('#jobh-right');
    await expect(right).toHaveAttribute('aria-expanded', 'false');
    await right.click();
    await expect(right).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#job-right')).toContainText('N1 to N2 Technical Support');
    await expect(page.locator('.job-track')).toContainText('N1 Support → N2 Support → Squad Lead');
  });

  test('skills are grouped by what they are for', async ({ page }) => {
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await expect(page.locator('.skill-group')).toHaveCount(6);
    for (const tool of ['Playwright', 'Postman', 'PostgreSQL', 'Datadog', 'k6', 'Git / GitHub']) {
      await expect(page.locator('#skills')).toContainText(tool);
    }
  });

  test('What I Do lists the seven practices', async ({ page }) => {
    await expect(page.locator('.do-card')).toHaveCount(7);
    await expect(page.locator('#whatido')).toContainText('Bug Investigation');
  });

  test('the bug report expands into steps, results and evidence', async ({ page }) => {
    await page.locator('#bugs').scrollIntoViewIfNeeded();
    const head = page.locator('#bugh');
    await expect(head).toHaveAttribute('aria-expanded', 'false');
    await head.click();
    await expect(page.locator('#bug-body')).toContainText('Order confirmation should be displayed.');
    await expect(page.locator('#bug-body ol li')).toHaveCount(5);
    await expect(page.locator('#bug-body')).toContainText('POST /checkout → 500');
  });

  test('the API tester opens an endpoint and switches tabs', async ({ page }) => {
    await page.locator('#api').scrollIntoViewIfNeeded();
    await expect(page.locator('#apiHint')).toBeVisible();

    await page.locator('.api-row[data-k="0"]').click();
    await expect(page.locator('#apiTabs')).toBeVisible();
    await expect(page.locator('#apiPane')).toContainText('HTTP/1.1 200 OK');

    await page.locator('[data-tab="payload"]').click();
    await expect(page.locator('#apiPane')).toContainText('"count": 2');

    await page.locator('.api-row[data-k="2"]').click();
    await page.locator('[data-tab="status"]').click();
    await expect(page.locator('#apiPane')).toContainText('401 Unauthorized');
  });

  test('the project card runs through to the published Test Lab', async ({ page }) => {
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.getByRole('link', { name: /explore test suite/i }).click();

    // academybugs.html is only the doorway now, and it hands over immediately
    await expect(page).toHaveURL(TEST_LAB);
  });

  test('every Test Lab card links to the deployed test suite', async ({ page }) => {
    await page.locator('#testlab').scrollIntoViewIfNeeded();
    const cards = page.locator('.lab-card');
    await expect(cards).toHaveCount(3);
    for (const i of [0, 1, 2]) {
      await expect(cards.nth(i).locator('a')).toHaveAttribute('href', TEST_LAB);
      await expect(cards.nth(i).locator('a')).toHaveAttribute('rel', 'noopener noreferrer');
    }
    // the section says out loud where the lab is hosted
    await expect(page.locator('#testlab')).toContainText('tuliohoc.github.io/academybugs-tests-');
  });

  test('a click anywhere on a Test Lab card opens the deployed lab', async ({ page }) => {
    await page.route('https://tuliohoc.github.io/**', route =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>lab</title>' }),
    );
    const card = page.locator('.lab-card').first();
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForURL('https://tuliohoc.github.io/academybugs-tests-/');
  });

  test('the contact block carries the three channels', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.locator('#contact a[href^="https://www.linkedin.com"]')).toBeVisible();
    await expect(page.locator('#contact a[href="https://github.com/Tuliohoc"]')).toBeVisible();
    await expect(page.locator('#contact a[href^="mailto:"]')).toBeVisible();
  });

  test('the theme switch flips the theme and remembers it', async ({ page }) => {
    const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
    const before = await theme();
    await page.locator('#theme').click();
    const after = await theme();
    expect(after).not.toBe(before);

    await page.reload();
    expect(await theme()).toBe(after);
  });

  test('the footer carries the version', async ({ page }) => {
    await expect(page.locator('.foot .ver')).toHaveText(/^v\d+\.\d+\.\d+$/);
    await expect(page.locator('.foot')).toContainText('Tulio Ramos');
  });
});

test.describe('language switch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('EN and PT swap the whole interface without a reload', async ({ page }) => {
    await expect(page.locator('#about h2')).toHaveText('About Me');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.locator('[data-lang="pt"]').click();
    await expect(page.locator('#about h2')).toHaveText('Sobre Mim');
    await expect(page.locator('#experience h2')).toHaveText('Experiência');
    await expect(page.locator('.hero-status')).toContainText('Atualmente trabalhando');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
    await expect(page).toHaveTitle(/Automação de Testes/);

    await page.locator('[data-lang="en"]').click();
    await expect(page.locator('#about h2')).toHaveText('About Me');
    await expect(page).toHaveTitle(/Test Automation/);
  });

  test('the choice is pressed, translated and remembered across a reload', async ({ page }) => {
    await page.locator('[data-lang="pt"]').click();
    await expect(page.locator('[data-lang="pt"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-lang="en"]')).toHaveAttribute('aria-pressed', 'false');

    await page.reload();
    await expect(page.locator('#about h2')).toHaveText('Sobre Mim');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
  });

  test('technical artifacts stay in English under PT', async ({ page }) => {
    await page.locator('[data-lang="pt"]').click();
    // tool names, the environment and the suite itself are not translated
    await expect(page.locator('#skills')).toContainText('Playwright');
    await expect(page.locator('#skills')).toContainText('Datadog');
    await expect(page.locator('#projects .term')).toContainText('$ npx playwright test');
  });
});

test.describe('the Test Lab doorway', () => {
  test('the page says where the lab went and links to it', async ({ page }) => {
    const response = await page.request.get('/academybugs.html');
    expect(response.status()).toBe(200);
    const html = await response.text();

    // it hands the visitor over on its own, and still offers the link itself
    expect(html).toContain(`content="0; url=${TEST_LAB}"`);
    expect(html).toContain(`href="${TEST_LAB}"`);
    expect(html).toContain('data-i18n="ab.move.cta"');
    expect(html).toContain('<meta name="robots" content="noindex">');
    // the lab screen is not kept here any more
    expect(html).not.toContain('id="runner"');
    expect(html).not.toContain('id="suitePick"');
  });

  test('opening it hands the visitor over to the published Test Lab', async ({ page }) => {
    await page.goto('/academybugs.html');
    await expect(page).toHaveURL(TEST_LAB);
  });
});

test.describe('asset versions', () => {
  // The ?v= token is what makes a deploy reach a browser that has been here
  // before. A page that falls behind the others looks unchanged for anyone with
  // a warm cache, so every page on the shared stylesheet must ask for the same one.
  test('every page asks for the same stylesheet and theme script', async ({ page }) => {
    const versions = async (path: string) => {
      await page.goto(path);
      return page.evaluate(() => ({
        css: (document.querySelector('link[href*="site.css"]') as HTMLLinkElement).getAttribute('href'),
        js: (document.querySelector('script[src*="theme.js"]') as HTMLScriptElement).getAttribute('src'),
      }));
    };

    const home = await versions('/');
    expect(home.css).toMatch(/\?v=/);
    expect(home.js).toMatch(/\?v=/);

    // the doorway is read from its markup too: opening it sends you elsewhere
    const html = await (await page.request.get('/academybugs.html')).text();
    const css = html.match(/href="(assets\/css\/site\.css\?v=[^"]+)"/)?.[1];
    const js = html.match(/src="(assets\/js\/theme\.js\?v=[^"]+)"/)?.[1];
    expect(css).toBe(home.css);
    expect(js).toBe(home.js);
  });

  test('every page carries the logo as its social image', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('meta[property="og:image"]'))
      .toHaveAttribute('content', /assets\/img\/logo\.jpeg\?v=/);
    await expect(page.locator('meta[name="twitter:image"]'))
      .toHaveAttribute('content', /assets\/img\/logo\.jpeg/);

    // the doorway is read from its own markup: opening it sends you elsewhere
    const response = await request.get('/academybugs.html');
    const html = await response.text();
    expect(html).toMatch(/property="og:image" content="[^"]*assets\/img\/logo\.jpeg\?v=/);
    expect(html).toMatch(/name="twitter:image" content="[^"]*assets\/img\/logo\.jpeg/);
  });
});

test.describe('addresses', () => {
  test('an unknown section in the address lands on the not found page', async ({ page }) => {
    await page.goto('/index.html#about5');
    await expect(page).toHaveURL(/404\.html$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('That page does not exist');
  });

  test('an unknown path lands on the not found page', async ({ page }) => {
    const response = await page.request.get('/no-such-page');
    expect(response.status()).toBe(404);
  });

  // Links to the sections this design replaced are already out in the world,
  // so they have to keep landing somewhere sensible.
  for (const [old, now] of [['approach', 'about'], ['journey', 'experience'], ['work', 'projects']]) {
    test(`the old #${old} anchor still reaches #${now}`, async ({ page }) => {
      await page.goto(`/index.html#${old}`);
      await expect(page).toHaveURL(new RegExp(`#${now}$`));
      await expect(heading(page, now)).toBeInViewport({ timeout: 10_000 });
    });
  }
});

