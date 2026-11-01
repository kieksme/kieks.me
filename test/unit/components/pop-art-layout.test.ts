import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import Heading from '../../../src/components/ui/atoms/Heading.astro';
import Lead from '../../../src/components/ui/atoms/Lead.astro';
import Halftone from '../../../src/components/ui/atoms/Halftone.astro';
import ServiceCard from '../../../src/components/ui/molecules/ServiceCard.astro';
import MarqueeBand from '../../../src/components/ui/organisms/MarqueeBand.astro';
import CtaSection from '../../../src/components/ui/organisms/CtaSection.astro';
import Flames from '../../../src/components/ui/atoms/Flames.astro';
import ZigzagDivider from '../../../src/components/ui/atoms/ZigzagDivider.astro';

function circles(html: string) {
  return [...html.matchAll(/<circle\b[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"[^>]*r="([\d.]+)"/g)].map(
    ([, x, y, radius]) => ({ x: Number(x), y: Number(y), radius: Number(radius) })
  );
}

describe('Pop-Art layout components', () => {
  it('preserves heading semantics, custom shadow, color and text', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Heading, {
      props: { level: 1, size: 'xl', shadowSize: '2px 3px 0', shadowColor: 'navy', color: 'aqua' },
      slots: { default: 'ihre software.' },
    });
    expect(html).toMatch(/<h1\b/);
    expect(html).toContain('ihre software.');
    expect(html).toContain('text-shadow: 2px 3px 0 navy');
    expect(html).toContain('color: aqua');
  });

  it('keeps the lead tone and compact size usable independently', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Lead, {
      props: { size: 'm', tone: 'onColor', class: 'example-lead' },
      slots: { default: 'Klarer Inhalt.' },
    });
    expect(html).toContain('color: inherit');
    expect(html).toContain('example-lead');
    expect(html).toContain('Klarer Inhalt.');
  });

  it('keeps top-edge halftone radii equal across a row and smaller on the next row', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Halftone, {
      props: { width: 64, height: 32, pitch: 16, origin: 'top', d0: 9, k: 0.03 },
    });
    const dots = circles(html);
    expect(dots).toHaveLength(8);
    expect(dots[0].x).not.toBe(dots[3].x);
    expect(dots[0].radius).toBe(dots[3].radius);
    expect(dots[4].radius).toBeLessThan(dots[0].radius);
    expect(dots[0].radius).toBeCloseTo(4.38);
  });

  it('retains radial fading for a top-right halftone origin', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Halftone, {
      props: { width: 64, height: 32, pitch: 16, origin: 'top-right', d0: 9, k: 0.03 },
    });
    const dots = circles(html);
    expect(dots[3].radius).toBeGreaterThan(dots[0].radius);
    expect(dots[4].radius).toBeLessThan(dots[0].radius);
  });

  it('renders an additional service without changing its destination or title', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ServiceCard, {
      props: {
        num: '05',
        title: 'Agent-Hub',
        description: 'Geprüfte Werkzeuge für Ihr Team.',
        href: '/agent-hub',
        linkText: 'Mehr zum Agent-Hub',
        headColor: 'aqua',
        shadow: 'fuchsia',
      },
    });
    expect(html).toMatch(/<h3\b[^>]*>\s*Agent-Hub\s*<\/h3>/);
    expect(html).toContain('href="/agent-hub"');
    expect(html).toContain('Mehr zum Agent-Hub');
    expect(html).toContain('--pop-card-shadow-color: var(--pop-fuchsia)');
    expect(html).toContain('pop-service-card__body');
    expect(html).toContain('color: var(--text-primary)');
    expect(html).toContain('color: var(--text-secondary)');
    expect(html).not.toContain('--service-body-bg');
  });

  it('keeps one semantic slogan and hides desktop animation duplicates from assistive technology', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(MarqueeBand, {
      props: { sticker: 'Haltung', text: 'klar · offen · gemeinsam' },
    });
    expect(html.match(/class="pop-band__message\b/g)).toHaveLength(1);
    expect(html).toContain('klar.');
    expect(html).toContain('offen.');
    expect(html).toContain('gemeinsam.');
    expect(html).toMatch(/aria-hidden="true"[^>]*>\s*<div[^>]*class="motion-safe:pop-marquee/);
  });

  it('preserves the CTA action and optional email while decorative dots stay hidden', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CtaSection, {
      props: {
        title: 'lernen wir uns kennen',
        text: 'Ein gemeinsames Gespräch.',
        ctaHref: '/kontakt',
        ctaText: 'Kontakt',
        showEmailLink: true,
      },
    });
    expect(html).toContain('href="/kontakt"');
    expect(html).toContain('href="mailto:kontakt@kieks.me"');
    expect(html).toContain('Ein gemeinsames Gespräch.');
    expect(html.match(/<svg\b[^>]*aria-hidden="true"/g)).toHaveLength(2);
    expect(html).not.toContain('calendar-event');
  });

  it('does not render an email action when it is disabled', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CtaSection, { props: { title: 'Kontakt', showEmailLink: false } });
    expect(html).not.toContain('mailto:');
  });

  it('uses decorative responsive flame sources with their original aspect ratios', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Flames);
    expect(html.match(/<picture\b/g)).toHaveLength(2);
    expect(html.match(/<source\b/g)).toHaveLength(2);
    expect(html).toContain('width="390" height="130"');
    expect(html).toContain('width="390" height="90"');
    expect(html).toContain('width="1440" height="150"');
    expect(html).not.toContain('scaleY');
    expect(html).not.toContain('class="pop-flames ');
    const yellow = await readFile(
      new URL('../../../src/assets/pop/655-1040_flammen-gelb-original.svg', import.meta.url),
      'utf8'
    );
    expect(yellow).toContain('width="1440" height="150"');
  });

  it('keeps a divider decorative and respects an explicit height', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ZigzagDivider, { props: { height: 18, top: 'navy', bottom: 'aqua' } });
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('height: 18px');
    expect(html).toContain('background: navy');
    expect(html).toContain('background-color: aqua');
  });
});
