import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ToggleTheme from '../../../src/components/common/ToggleTheme.astro';
import ToggleMenu from '../../../src/components/common/ToggleMenu.astro';
import SocialShare from '../../../src/components/common/SocialShare.astro';

const render = async (component: Parameters<AstroContainer['renderToString']>[0], url: string) => {
  const container = await AstroContainer.create();
  return container.renderToString(component, {
    props: { url: 'https://kieks.me/blog/x', text: 'Titel' },
    request: new Request(url),
  });
};

describe('zugängliche Namen (DE/EN)', () => {
  it('ToggleTheme', async () => {
    expect(await render(ToggleTheme, 'http://localhost/')).toContain(
      'aria-label="Zwischen Dunkel- und Hellmodus wechseln"'
    );
    expect(await render(ToggleTheme, 'http://localhost/en')).toContain(
      'aria-label="Switch between dark and light mode"'
    );
  });

  it('ToggleMenu', async () => {
    expect(await render(ToggleMenu, 'http://localhost/')).toContain('aria-label="Menü ein- oder ausklappen"');
    expect(await render(ToggleMenu, 'http://localhost/en/blog')).toContain('aria-label="Toggle menu"');
  });

  it('SocialShare: jeder Icon-Button hat aria-label in der Seitensprache', async () => {
    const de = await render(SocialShare, 'http://localhost/blog/x');
    const en = await render(SocialShare, 'http://localhost/en/blog/x');
    for (const name of ['X', 'Facebook', 'LinkedIn', 'WhatsApp'])
      expect(de).toContain(`aria-label="Auf ${name} teilen"`);
    for (const name of ['X', 'Facebook', 'LinkedIn', 'WhatsApp']) expect(en).toContain(`aria-label="Share on ${name}"`);
    expect(de).toContain('aria-label="Per E-Mail teilen"');
    expect(en).toContain('aria-label="Share by email"');
    expect(de.match(/<button/g)).toHaveLength(de.match(/<button[^>]*aria-label=/g)!.length);
    expect(de).not.toContain('Twitter Share');
  });
});
