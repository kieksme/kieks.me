import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import Logo from '../../../src/components/ui/atoms/Logo.astro';
import HeroArtFinger from '../../../src/components/ui/organisms/HeroArtFinger.astro';
import circleLogoUrl from '../../../src/assets/brand/logos/kieks.me-single-circle.svg?url';
import circleLogoDarkUrl from '../../../src/assets/brand/logos/kieks.me-single-circle-dark.svg?url';

const approvedBlob = '82c16492f94b6fee93eaf79d04b86ea0b556c349';

describe('approved circular brand logo', () => {
  it('uses the original brand asset byte for byte', async () => {
    const asset = await readFile(
      new URL('../../../src/assets/brand/logos/kieks.me-single-circle.svg', import.meta.url)
    );
    const blob = createHash('sha1').update(`blob ${asset.length}\0`).update(asset).digest('hex');
    expect(blob).toBe(approvedBlob);
  });

  it('keeps the approved navy disc on light surfaces and an open aqua ring on dark surfaces', async () => {
    const darkAsset = await readFile(
      new URL('../../../src/assets/brand/logos/kieks.me-single-circle-dark.svg', import.meta.url),
      'utf8'
    );
    expect(darkAsset).toMatch(/<circle[^>]*fill="none"[^>]*stroke="#00FFDC"[^>]*stroke-width="16"/);
    expect(darkAsset).not.toContain('#F0F2F9');
    expect(darkAsset).not.toContain('fill="#1E2A45"');
    expect(darkAsset).toContain('fill="#FF008F"');
    expect(darkAsset).toContain('stroke="#00FFDC"');

    const container = await AstroContainer.create();
    const light = await container.renderToString(Logo, { props: { variant: 'light' } });
    expect(light.match(/<img\b/g)).toHaveLength(1);
    expect(light).toContain(`src="${circleLogoUrl}"`);
    expect(light).not.toContain(circleLogoDarkUrl);

    const dark = await container.renderToString(Logo, { props: { variant: 'dark' } });
    expect(dark.match(/<img\b/g)).toHaveLength(1);
    expect(dark).toContain(`src="${circleLogoDarkUrl}"`);
    expect(dark).toContain('alt="kieks.me"');
    expect(dark).not.toContain(circleLogoUrl);

    const auto = await container.renderToString(Logo, { props: { variant: 'auto' } });
    expect(auto.match(/<img\b/g)).toHaveLength(2);
    expect(auto).toContain(`src="${circleLogoUrl}"`);
    expect(auto).toContain(`src="${circleLogoDarkUrl}"`);
    expect(auto).toContain('dark:hidden');
    expect(auto).toContain('hidden dark:block');
    expect(auto).toContain('width="56" height="56"');
    expect(auto).not.toContain('assets/pop');
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

  it('shows the horizontal wordmark as navy disc plus HTML text (no aqua ring, no k-overlap)', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Logo, {
      props: { layout: 'horizontal', size: 'sm', isAnimated: false },
    });
    expect(html).toContain('data-logo-layout="horizontal"');
    expect(html).toContain('brand-logo--horizontal');
    expect(html).toContain('gap-3');
    expect(html).toContain(`src="${circleLogoUrl}"`);
    expect(html).not.toContain(circleLogoDarkUrl);
    expect(html).not.toContain('kieks.me-horizontal-fuchsia');
    expect(html).toContain('brand-logo__word');
    expect(html).toContain('kieks');
    expect(html).toContain('.me');
    expect(html).toContain('width="30" height="30"');
    expect(html.match(/<img\b/g)).toHaveLength(1);
  });

  it('uses the same original in the hero without the jagged substitute', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(HeroArtFinger, { props: { showOpenSource: false } });
    expect(html).toContain(`src="${circleLogoUrl}"`);
    expect(html).toContain(`src="${circleLogoDarkUrl}"`);
    expect(html).toContain('width="520" height="520"');
    expect(html.match(/<img\b/g)).toHaveLength(2);
    expect(html).not.toMatch(/imgHeroArt|BurstGelb|FingerMultiStacked|pop-spin|pop-tap/);
  });
});
