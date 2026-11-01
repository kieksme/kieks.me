import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

function classes() {
  const values = new Set<string>();
  return {
    add: (...names: string[]) => names.forEach((name) => values.add(name)),
    remove: (...names: string[]) => names.forEach((name) => values.delete(name)),
    contains: (name: string) => values.has(name),
  };
}

async function navigationFixture(hasLegacyToggle: boolean) {
  const source = await readFile(new URL('../../../src/components/common/BasicScripts.astro', import.meta.url), 'utf8');
  const script = source.split('<script is:inline define:vars={{ defaultTheme: UI.theme }}>')[1].split('</script>')[0];
  const nav = { classList: classes() };
  const controls = { classList: classes() };
  const header = { classList: classes() };
  const toggle = { classList: classes() };
  let mediaChange = () => {};
  let detailsClosed = false;
  const document = {
    body: { classList: classes() },
    documentElement: { classList: classes() },
    querySelectorAll: () => [],
    querySelector: (selector: string) => {
      if (selector === '[data-aw-toggle-menu]') return hasLegacyToggle ? toggle : null;
      if (selector === '#header nav') return nav;
      if (selector === '#header > div > div:last-child') return controls;
      if (selector === '#header details') return { removeAttribute: () => (detailsClosed = true) };
      return null;
    },
    getElementById: () => header,
    addEventListener: () => {},
  };
  const window = {
    scrollY: 0,
    matchMedia: () => ({ matches: false, addEventListener: (_event: string, fn: () => void) => (mediaChange = fn) }),
    onload: () => {},
    onpageshow: () => {},
  };
  vm.runInNewContext(`(function () { ${script} })()`, { window, document, localStorage: {}, defaultTheme: 'system' });
  window.onload();
  window.onpageshow();
  mediaChange();
  return { nav, controls, detailsClosed };
}

describe('header menu compatibility', () => {
  it('keeps the native Pop-Art menu controls visible after page show and resizing', async () => {
    const result = await navigationFixture(false);
    expect(result.nav.classList.contains('hidden')).toBe(false);
    expect(result.controls.classList.contains('hidden')).toBe(false);
    expect(result.detailsClosed).toBe(true);
  });

  it('preserves the original toggle-driven header behaviour', async () => {
    const result = await navigationFixture(true);
    expect(result.nav.classList.contains('hidden')).toBe(true);
    expect(result.controls.classList.contains('hidden')).toBe(true);
  });
});
