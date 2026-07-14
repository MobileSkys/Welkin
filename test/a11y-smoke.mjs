// A11y smoke over the example pages (docs/09 testing floor, board T-56):
// axe in light + dark schemes, reduced-motion behaviour assertions, and a
// forced-colors render pass. Requires `npm run build` first (pages load
// the dist bundles). Run: npm run test:a11y
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';

const exampleUrl = (name) =>
  pathToFileURL(fileURLToPath(new URL(`../examples/${name}`, import.meta.url))).href;
const page_url = exampleUrl('kitchen-sink.html');
const PAGES = ['kitchen-sink.html', 'layout.html', 'components.html',
  'showcase-solstice.html', 'showcase-nimbus.html', 'showcase-aster.html', 'showcase-fern.html'];

let failures = 0;
const fail = (msg) => { failures++; console.error(`FAIL ${msg}`); };
const ok = (msg) => console.log(`  ok   ${msg}`);

const browser = await chromium.launch();

async function axePass(label, contextOptions = {}) {
  const context = await browser.newContext(contextOptions);
  for (const name of PAGES) {
    const page = await context.newPage();
    await page.goto(exampleUrl(name));
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    if (results.violations.length) {
      fail(`${label} ${name}: ${results.violations.length} axe violation(s)`);
      for (const v of results.violations) {
        console.error(`       ${v.id}: ${v.help}`);
        for (const n of v.nodes) console.error(`         ${n.html}`);
      }
    } else {
      ok(`${label} ${name}: axe clean`);
    }
    await page.close();
  }
  await context.close();
}

// 1+2. axe, both schemes (colour contrast is scheme-dependent).
await axePass('light scheme', { colorScheme: 'light' });
await axePass('dark scheme', { colorScheme: 'dark' });

// 3. Reduced motion: multiplier zeroed, smooth scroll off (docs/05, reset).
{
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(page_url);
  const { motion, scrollBehavior } = await page.evaluate(() => ({
    motion: getComputedStyle(document.documentElement).getPropertyValue('--wel-motion').trim(),
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  motion === '0' ? ok('reduced motion: --wel-motion is 0') : fail(`reduced motion: --wel-motion = "${motion}", expected 0`);
  scrollBehavior === 'auto' ? ok('reduced motion: scroll-behavior auto') : fail(`reduced motion: scroll-behavior = ${scrollBehavior}`);
  await context.close();
}

// 3b. Scheme pinning re-resolves tokens (ADR-0007 amendment, T-84): a
// data-theme="dark" subtree on a light page must get the DARK surface —
// typed tokens resolve where declared, so the token block re-declares on
// [data-theme] roots. Also: a scoped accent must re-derive its hover shade.
{
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto(page_url);
  const r = await page.evaluate(() => {
    const g = (el, t) => getComputedStyle(el).getPropertyValue(t).trim();
    const pin = document.createElement('div');
    pin.setAttribute('data-theme', 'dark');
    const brand = document.createElement('div');
    brand.setAttribute('data-theme', 'probe-brand');
    brand.style.setProperty('--wel-color-accent', 'oklch(50% 0.11 190)');
    document.body.append(pin, brand);
    return {
      rootSurface: g(document.documentElement, '--wel-color-surface'),
      pinSurface: g(pin, '--wel-color-surface'),
      pinShadow: g(pin, '--wel-shadow-color'),
      brandHover: g(brand, '--wel-color-accent-hover'),
    };
  });
  r.pinSurface !== r.rootSurface && r.pinSurface.includes('0.17')
    ? ok('scheme pin: dark surface re-resolves inside data-theme="dark"')
    : fail(`scheme pin: pinned surface "${r.pinSurface}" (root "${r.rootSurface}")`);
  r.pinShadow.includes('0.55')
    ? ok('scheme pin: shadow colour deepens inside the pin')
    : fail(`scheme pin: pinned shadow "${r.pinShadow}"`);
  r.brandHover.includes('190')
    ? ok('sub-brand: hover re-derives from the scoped accent')
    : fail(`sub-brand: hover "${r.brandHover}" did not re-derive from hue 190`);
  await context.close();
}

// 4. Forced colors: page renders, boundaries survive (table row rules are
// borders, not backgrounds — the docs/09 bg-only-state rule), and axe's
// non-contrast rules stay clean (contrast is UA-controlled under forced
// colors, so axe disables those checks itself).
{
  const context = await browser.newContext({ forcedColors: 'active' });
  const page = await context.newPage();
  await page.goto(page_url);
  const borderWidth = await page.evaluate(() => {
    const th = document.querySelector('tbody th');
    return getComputedStyle(th).borderBlockEndWidth;
  });
  borderWidth !== '0px' ? ok('forced colors: table row rule survives as border') : fail('forced colors: table row rule vanished');
  await page.close();
  for (const name of PAGES) {
    const p = await context.newPage();
    await p.goto(exampleUrl(name));
    const results = await new AxeBuilder({ page: p })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    results.violations.length
      ? fail(`forced colors ${name}: ${results.violations.length} axe violation(s): ${results.violations.map((v) => v.id).join(', ')}`)
      : ok(`forced colors ${name}: axe clean`);
    await p.close();
  }
  await context.close();
}

await browser.close();

if (failures) {
  console.error(`${failures} a11y smoke failure(s)`);
  process.exit(1);
}
console.log('a11y smoke passed');
