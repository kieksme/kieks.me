import { loadCmsBuildContent, publicSlug, relationId, text } from './payload-build';
import { cmsCourses } from './courses';
import type { CmsBuildContent, CmsDocument } from './payload-build';
export type Locale = 'de' | 'en';
export interface LocalizedRoute {
  collection: string;
  id: string;
  locale: Locale;
  path: string;
  document: CmsDocument;
}
export function localizedRoutes(content: CmsBuildContent): LocalizedRoute[] {
  const locale = content.locale ?? 'de';
  const routes: LocalizedRoute[] = [];
  const add = (collection: string, docs: CmsDocument[]) => {
    for (const document of docs) {
      if (document._status !== 'published') continue;
      if (locale === 'en' && !text(document.pathSlug)) continue;
      if (locale === 'de' && !text(document.slug)) continue;
      const profiles = new Set(
        content.authors
          .filter((author) => author._status === 'published' && (locale === 'de' || text(author.pathSlug)))
          .map((author) => relationId(author.id))
      );
      if (
        collection === 'trainings' &&
        (!Array.isArray(document.trainers) ||
          !document.trainers.length ||
          document.trainers.some((trainer) => !profiles.has(relationId(trainer))))
      )
        continue;
      if (collection === 'posts' && document.author && !profiles.has(relationId(document.author))) continue;
      const slug = publicSlug(locale === 'en' ? document.pathSlug : document.slug);
      const path =
        collection === 'pages'
          ? document.pageKind === 'home'
            ? locale === 'en'
              ? '/en'
              : '/'
            : document.pageKind === 'legal'
              ? `${locale === 'en' ? '/en' : ''}/${slug}`
              : `${locale === 'en' ? '/en/content' : '/inhalte'}/${slug}`
          : collection === 'posts'
            ? `${locale === 'en' ? '/en' : ''}/blog/${slug}`
            : collection === 'authors'
              ? `${locale === 'en' ? '/en/blog/authors' : '/blog/autoren'}/${slug}`
              : collection === 'trainings'
                ? `${locale === 'en' ? '/en' : ''}/trainings/${slug}`
                : collection === 'services'
                  ? `${locale === 'en' ? '/en/services' : '/leistungen'}/${slug}`
                  : `${locale === 'en' ? '/en/projects' : '/projekte/mcp-server'}/${slug}`;
      if (routes.some((route) => route.path === path)) throw new Error('Duplicate localized route');
      routes.push({ collection, id: relationId(document.id), locale, path, document });
    }
  };
  add('pages', content.pages);
  add('posts', content.posts);
  add('authors', content.authors);
  for (const collection of ['trainings', 'services', 'mcp-projects']) add(collection, content.site[collection] ?? []);
  return routes;
}
export async function alternatesForPath(path: string) {
  const [de, en] = await Promise.all([loadCmsBuildContent('de'), loadCmsBuildContent('en')]);
  const german = localizedRoutes(de),
    english = localizedRoutes(en);
  const current = [...german, ...english].find(
    (route) => route.path === path.replace(/\/$/, '') || (path === '/' && route.path === '/')
  );
  if (current) {
    const pair = [...german, ...english].filter(
      (route) => route.collection === current.collection && route.id === current.id
    );
    if (pair.length === 2) return pair.map(({ locale, path }) => ({ locale, path }));
  }
  if (en.enabled) {
    // Courses are not part of the generic localized routes: they have their own pages and pair by Datahub id.
    const clean = path.replace(/\/$/, '');
    if (['/kurse', '/en/courses'].includes(clean))
      return [
        { locale: 'de' as const, path: '/kurse' },
        { locale: 'en' as const, path: '/en/courses' },
      ];
    const germanCourses = cmsCourses(de),
      englishCourses = cmsCourses(en);
    const course = [...germanCourses, ...englishCourses].find((item) => item.url === clean);
    const pairDe = course && germanCourses.find((item) => item.id === course.id);
    const pairEn = course && englishCourses.find((item) => item.id === course.id);
    if (pairDe && pairEn)
      return [
        { locale: 'de' as const, path: pairDe.url },
        { locale: 'en' as const, path: pairEn.url },
      ];
  }
  if (en.enabled && ['/trainings', '/en/trainings', '/blog', '/en/blog'].includes(path.replace(/\/$/, ''))) {
    const suffix = path.replace(/^\/en/, '').replace(/\/$/, '');
    return [
      { locale: 'de' as const, path: suffix },
      { locale: 'en' as const, path: '/en' + suffix },
    ];
  }
  if (en.enabled && ['/', '/en', '/en/'].includes(path))
    return [
      { locale: 'de' as const, path: '/' },
      { locale: 'en' as const, path: '/en' },
    ];
  return [];
}
