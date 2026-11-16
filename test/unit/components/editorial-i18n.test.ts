import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import EditorialContent from '../../../src/components/editorial/EditorialContent.astro';

const author = { name: 'Ada', contactEnabled: true, posts: [] };

const render = async (url: string) => {
  const container = await AstroContainer.create();
  return container.renderToString(EditorialContent, {
    props: { collection: 'authors', document: author },
    request: new Request(url),
  });
};

describe('EditorialContent Texte', () => {
  it('rendert deutsche Texte und aria-labels auf deutschen Seiten', async () => {
    const html = await render('http://localhost/inhalte/ada');
    expect(html).toContain('aria-label="Artikel dieser Person"');
    expect(html).toContain('Noch keine veröffentlichten Artikel zugeordnet.');
    expect(html).toContain('aria-label="Inaktive Kontaktformular-Vorschau"');
  });

  it('rendert englische Texte und aria-labels unter /en', async () => {
    const html = await render('http://localhost/en/authors/ada');
    expect(html).toContain('aria-label="Articles by this person"');
    expect(html).toContain('No published articles assigned yet.');
    expect(html).toContain('aria-label="Inactive contact form preview"');
    expect(html).not.toContain('Noch keine');
    expect(html).not.toContain('Kontaktformular');
  });
});
