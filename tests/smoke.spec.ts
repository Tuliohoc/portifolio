import { test, expect, type Page } from '@playwright/test';

const heading = (page: Page, id: string) =>
  page.locator(`#${id} h1, #${id} h2`).first();

/* Opening the full report scrolls to it smoothly, and a click dispatched while
   that scroll is still running lands on whatever sits under the pointer. The
   suite waits for the page to come to rest before clicking anything the scroll
   moved. */
const settled = async (page: Page) => {
  await expect.poll(async () => {
    const before = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => window.scrollY);
    return before === after;
  }, { timeout: 5_000 }).toBe(true);
};

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

  test('the project card opens the AcademyBugs suite page', async ({ page }) => {
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.getByRole('link', { name: /explore test suite/i }).click();

    await expect(page).toHaveURL(/academybugs\.html$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('AcademyBugs — QA Automation Project');
  });

  test('every Test Lab card links to the deployed test suite', async ({ page }) => {
    await page.locator('#testlab').scrollIntoViewIfNeeded();
    const cards = page.locator('.lab-card');
    await expect(cards).toHaveCount(3);
    for (const i of [0, 1, 2]) {
      await expect(cards.nth(i).locator('a')).toHaveAttribute('href', 'https://tuliohoc.github.io/academybugs-tests-/');
    }
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

test.describe('academybugs project page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/academybugs.html');
  });

  test('renders without javascript errors and names the project', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      const isThirdPartyResource = message.text().includes('Failed to load resource');
      if (message.type() === 'error' && !isThirdPartyResource) errors.push(message.text());
    });

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'AcademyBugs — QA Automation Project' })).toBeVisible();
    await expect(page.locator('#facts')).toContainText('Application Under Test');
    await expect(page.locator('.approach li')).toHaveCount(6);
    expect(errors).toEqual([]);
  });

  test('the Playwright run reports 22 tests and a 90.9% pass rate', async ({ page }) => {
    await page.locator('#lab').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /run playwright tests/i }).click();

    const runner = page.locator('#runner');
    await expect(runner).toBeVisible();
    await expect(page.locator('#runSuite')).toContainText('Running Playwright Test Suite');
    await expect(page.locator('#fBrowser')).toHaveText('Chromium');
    await expect(page.locator('#fTests')).toHaveText('22');
    await expect(page.locator('#progPct')).not.toHaveText('0%');

    const done = page.locator('#runDone');
    await expect(done).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#stTotal')).toHaveText('22');
    await expect(page.locator('#stPassed')).toHaveText('20');
    await expect(page.locator('#stFailed')).toHaveText('2');
    await expect(page.locator('#stSkipped')).toHaveText('0');
    await expect(page.locator('#stRate')).toHaveText('90.9%');
    await expect(page.locator('#stDur')).toHaveText('01:42');

    await expect(page.locator('#repList .rep-row')).toHaveCount(6);
    await expect(page.locator('#repNote')).toContainText('6 of 22');
  });

  test('the failed test opens into steps, error and evidence', async ({ page }) => {
    await page.locator('#lab').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /run playwright tests/i }).click();
    await expect(page.locator('#runDone')).toBeVisible({ timeout: 15_000 });

    await page.locator('#repList .rep-row').nth(4).click();
    await expect(page.locator('#repBody')).toContainText('Checkout validation');
    await expect(page.locator('#repBody .st-label')).toContainText('Failed');
    await expect(page.locator('#repBody .rep-steps li')).toHaveCount(5);
    await expect(page.locator('#repBody .rep-pre.err')).toContainText('expect(received)');

    await page.getByRole('button', { name: 'Screenshot' }).click();
    await expect(page.locator('#repBody .rep-pre').last()).toContainText('checkout-validation.png');

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#repHint')).toBeVisible();
  });

  test('a passing test shows its steps without an error block', async ({ page }) => {
    await page.locator('#lab').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /run playwright tests/i }).click();
    await expect(page.locator('#runDone')).toBeVisible({ timeout: 15_000 });

    await page.locator('#repList .rep-row').first().click();
    await expect(page.locator('#repBody')).toContainText('Login with valid credentials');
    await expect(page.locator('#repBody .st-label')).toContainText('Passed');
    await expect(page.locator('#repBody .rep-pre.err')).toHaveCount(0);
  });

  test('Open Full Report embeds the Allure report below the run', async ({ page }) => {
    await page.locator('#lab').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /run playwright tests/i }).click();
    await expect(page.locator('#runDone')).toBeVisible({ timeout: 15_000 });

    const open = page.locator('#openFull');
    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#allure')).toBeHidden();

    await open.click();
    await expect(page.locator('#allure')).toBeVisible();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    // the report is this site's own folder, loaded lazily on the first click
    await expect(page.locator('#allureFrame')).toHaveAttribute('src', /allure\/index\.html/);
    await expect(page.locator('#allureMeta')).toContainText('Playwright Test Suite');
    await expect(page.locator('#allureMeta')).toContainText('22');

    await settled(page);
    await page.locator('#allureClose').click();
    await expect(page.locator('#allure')).toBeHidden();
    await expect(open).toHaveAttribute('aria-expanded', 'false');
  });

  test('a suite without a published report falls back to the text note', async ({ page }) => {
    await page.locator('#lab').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /run api tests/i }).click();
    await expect(page.locator('#runDone')).toBeVisible({ timeout: 15_000 });

    await page.locator('#openFull').click();
    await expect(page.locator('#fullNote')).toBeVisible();
    await expect(page.locator('#allure')).toBeHidden();
    await expect(page.locator('#openFull')).toHaveAttribute('aria-expanded', 'false');
  });

  test('Run again restarts the suite and closes the full report', async ({ page }) => {
    await page.locator('#lab').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /run playwright tests/i }).click();
    await expect(page.locator('#runDone')).toBeVisible({ timeout: 15_000 });

    await page.locator('#openFull').click();
    await expect(page.locator('#allure')).toBeVisible();
    await settled(page);
    await page.locator('#openFull').click();
    await expect(page.locator('#allure')).toBeHidden();

    await settled(page);
    await page.locator('#runAgain').click();
    await expect(page.locator('#runner')).toBeVisible();
    await expect(page.locator('#allure')).toBeHidden();
    await expect(page.locator('#allureFrame')).not.toHaveAttribute('src', /allure/);
    await expect(page.locator('#runDone')).toBeHidden();
    await expect(page.locator('#runDone')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#openFull')).toHaveAttribute('aria-expanded', 'false');
  });

  test('the Cypress run carries its own numbers', async ({ page }) => {
    await page.locator('#lab').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /run cypress tests/i }).click();
    await expect(page.locator('#runSuite')).toContainText('Cypress UI Suite');

    await expect(page.locator('#runDone')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#stTotal')).toHaveText('15');
    await expect(page.locator('#stPassed')).toHaveText('14');
    await expect(page.locator('#stFailed')).toHaveText('1');
    await expect(page.locator('#stRate')).toHaveText('93.3%');
  });

  test('the lab interface follows the language', async ({ page }) => {
    await page.locator('[data-lang="pt"]').click();
    await expect(page.locator('#report h2')).toHaveText('Relatório de Testes');
    await expect(page.locator('#repNote')).toContainText('Execute uma suíte');

    await page.locator('#lab').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /executar testes playwright/i }).click();
    await expect(page.locator('#runSuite')).toContainText('▶ Executando Playwright Test Suite');

    await expect(page.locator('#runDone')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.done-title')).toHaveText('EXECUÇÃO CONCLUÍDA');
    await expect(page.locator('#repList .rep-row')).toHaveCount(6);
    // the recorded test names do not change language
    await expect(page.locator('#repList .rep-row').nth(4)).toContainText('Checkout validation');
  });

  test('the full report follows the language', async ({ page }) => {
    await page.locator('[data-lang="pt"]').click();
    await expect(page.locator('#openFull')).toHaveText('Abrir Relatório Completo');

    await page.locator('#lab').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /executar testes playwright/i }).click();
    await expect(page.locator('#runDone')).toBeVisible({ timeout: 15_000 });

    await page.locator('#openFull').click();
    await expect(page.locator('#allure')).toBeVisible();
    await expect(page.locator('#allure .eyebrow')).toHaveText('Relatório Completo');
    await expect(page.locator('#allure h4')).toHaveText('Relatório Allure');
    await expect(page.locator('#allureMeta')).toContainText('Suíte: Playwright Test Suite');
    await expect(page.locator('#allureClose')).toHaveText('Fechar relatório');
    // the iframe itself is an artifact and keeps its own language
    await expect(page.locator('#allureFrame')).toHaveAttribute('src', /allure\/index\.html/);
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

    const project = await versions('/academybugs.html');
    expect(project.css).toBe(home.css);
    expect(project.js).toBe(home.js);
  });

  test('every page carries the logo as its social image', async ({ page }) => {
    for (const path of ['/', '/academybugs.html']) {
      await page.goto(path);
      await expect(page.locator('meta[property="og:image"]'))
        .toHaveAttribute('content', /assets\/img\/logo\.jpeg\?v=/);
      await expect(page.locator('meta[name="twitter:image"]'))
        .toHaveAttribute('content', /assets\/img\/logo\.jpeg/);
    }
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
