import { describe, it, expect } from 'vitest';
import { localizedRoutes } from '../../../src/utils/localization';
import type { CmsBuildContent } from '../../../src/utils/payload-build';
const content = (): CmsBuildContent => ({
  enabled: true,
  locale: 'en',
  pages: [],
  posts: [],
  authors: [],
  media: {},
  site: {},
});
describe('localized route identities', () => {
  it('uses translated public slugs and stable IDs, and excludes drafts or missing translations', () => {
    const data = content();
    data.authors = [{ id: 7, _status: 'published', pathSlug: 'trainer', slug: 'trainer' }];
    data.site.trainings = [
      { id: 1, _status: 'published', slug: 'deutscher-kurs', pathSlug: 'english-workshop', trainers: [7] },
      { id: 2, _status: 'draft', slug: 'entwurf', pathSlug: 'draft' },
      { id: 3, _status: 'published', slug: 'ohne-uebersetzung' },
    ];
    expect(
      localizedRoutes(data)
        .filter((route) => route.collection === 'trainings')
        .map(({ id, path }) => ({ id, path }))
    ).toEqual([{ id: '1', path: '/en/trainings/english-workshop' }]);
    data.locale = 'de';
    expect(localizedRoutes(data).find((route) => route.collection === 'trainings')?.path).toBe(
      '/trainings/deutscher-kurs'
    );
  });
  it('fails on route collisions instead of silently overwriting a translation', () => {
    const data = content();
    data.pages = [1, 2].map((id) => ({
      id,
      _status: 'published',
      pageKind: 'standard',
      slug: String(id),
      pathSlug: 'collision',
    }));
    expect(() => localizedRoutes(data)).toThrow('Duplicate localized route');
  });
});
