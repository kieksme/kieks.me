import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { cmsTrainings } from '../../../src/utils/trainings';
import type { CmsBuildContent } from '../../../src/utils/payload-build';
import TrainingTeaser from '../../../src/components/TrainingTeaser.astro';
import EditorialContent from '../../../src/components/editorial/EditorialContent.astro';
const content = (): CmsBuildContent => ({
  enabled: true,
  pages: [],
  posts: [],
  media: {},
  authors: [
    {
      id: 1,
      _status: 'published',
      slug: 'trainer',
      name: 'Public Person',
      email: 'private@example.invalid',
      apiKey: 'SECRET',
    },
  ],
  site: {
    trainings: [
      {
        id: 7,
        _status: 'published',
        slug: 'ki-praxis',
        title: 'KI <Praxis>',
        summary: 'Praktisch lernen',
        trainers: [1],
        deliveryLanguages: ['de', 'en'],
      },
    ],
  },
});
describe('published trainings and reusable teasers', () => {
  it('reuses public profiles and never trusts populated trainer data', () => {
    const data = content();
    data.site.trainings[0].trainers = [{ id: 1, name: 'INJECTED', email: 'SECRET' }];
    const training = cmsTrainings(data)[0];
    expect(training.trainers[0].name).toBe('Public Person');
    expect(JSON.stringify(training)).not.toMatch(/SECRET|private@|INJECTED/);
    expect(training.deliveryLanguages).toEqual(['Deutsch', 'Englisch']);
    expect(training.trainers[0].url).toBe('/blog/autoren/trainer');
  });
  it('hides trainings with withdrawn or missing profiles and rejects draft trainings, duplicate slugs and unsafe links', () => {
    const data = content();
    data.authors = [];
    expect(cmsTrainings(data)).toEqual([]);
    const draft = content();
    draft.site.trainings[0]._status = 'draft';
    expect(() => cmsTrainings(draft)).toThrow('Unpublished');
    const duplicate = content();
    duplicate.site.trainings.push({ ...duplicate.site.trainings[0], id: 8 });
    expect(() => cmsTrainings(duplicate)).toThrow('Duplicate');
    const unsafe = content();
    unsafe.site.trainings[0].requestUrl = 'javascript:alert(1)';
    expect(() => cmsTrainings(unsafe)).toThrow('unsafe');
  });
  it('escapes teaser text, shows trainers and renders an assigned teaser between editorial sections', async () => {
    const container = await AstroContainer.create();
    const training = cmsTrainings(content())[0];
    const html = await container.renderToString(TrainingTeaser, { props: { training } });
    expect(html).toContain('/trainings/ki-praxis');
    expect(html).toContain('KI &lt;Praxis&gt;');
    expect(html).toContain('Public Person');
    const editorial = await container.renderToString(EditorialContent, {
      props: {
        collection: 'pages',
        trainings: [training],
        document: {
          title: 'Seite',
          sections: [
            { kind: 'text', body: 'Before teaser' },
            { kind: 'training-teaser', training: 7 },
            { kind: 'text', body: 'After teaser' },
          ],
        },
      },
    });
    expect(editorial.indexOf('Before teaser')).toBeLessThan(editorial.indexOf('/trainings/ki-praxis'));
    expect(editorial.indexOf('/trainings/ki-praxis')).toBeLessThan(editorial.indexOf('After teaser'));
  });
});
