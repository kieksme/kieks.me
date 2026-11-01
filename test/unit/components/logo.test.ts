import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import Logo from '../../../src/components/ui/atoms/Logo.astro';
import HeroArtFinger from '../../../src/components/ui/organisms/HeroArtFinger.astro';
import circleLogoUrl from '../../../src/assets/brand/logos/kieks.me-single-circle.svg?url';

const approvedBlob = '82c16492f94b6fee93eaf79d04b86ea0b556c349';

describe('approved circular brand logo', () => {
  it('uses the original brand asset byte for byte', async () => {
    const asset = await readFile(
      new URL('../../../src/assets/brand/logos/kieks.me-single-circle.svg', import.meta.url)
    );
    const blob = createHash('sha1').update(`blob ${asset.length}\0`).update(asset).digest('hex');
    expect(blob).toBe(approvedBlob);
  });

  it.each(['auto', 'light', 'dark'] as const)('keeps one square original in %s theme', async (variant) => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Logo, { props: { variant } });
    expect(html.match(/<img\b/g)).toHaveLength(1);
    expect(html).toContain(`src="${circleLogoUrl}"`);
    expect(html).toContain('alt="kieks.me"');
    expect(html).toContain('width="56" height="56"');
    expect(html).not.toContain('assets/pop');
  });

  it('supports compact sizing and an explicit static variant', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Logo, {
      props: { size: 'sm', isAnimated: false, class: 'example-logo' },
    });
    expect(html).toContain('width="44" height="44"');
    expect(html).not.toContain('brand-logo--animated');
    expect(html).toContain('example-logo');
  });

  it('uses the same original in the hero without the jagged substitute', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(HeroArtFinger, { props: { showOpenSource: false } });
    expect(html).toContain(`src="${circleLogoUrl}"`);
    expect(html).toContain('width="520" height="520"');
    expect(html.match(/<img\b/g)).toHaveLength(1);
    expect(html).not.toMatch(/imgHeroArt|BurstGelb|FingerMultiStacked|pop-spin|pop-tap/);
  });
});
