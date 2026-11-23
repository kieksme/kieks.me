import type { CmsBuildContent } from './payload-build';
import { publicSlug, relationId, text } from './payload-build';

/** Course platform that hosts the actual (access-protected) course content. */
export const COURSES_ORIGIN = 'https://kurse.kieks.me';

/**
 * Public course teasers. Only title, description and the module overview
 * (title, duration, objectives) ever reach the website; course texts and the
 * question pool are neither requested nor accepted here.
 *
 * German is the source language. An English teaser exists only when the English
 * version has a title, its own URL name and complete module titles; otherwise the
 * course is simply absent from the English site (no fallback to German text).
 */
export function cmsCourses(content: CmsBuildContent) {
  const english = content.locale === 'en';
  const seen = new Set<string>();
  return (content.site.courses ?? [])
    .slice()
    .sort(
      (a, b) =>
        text(a.title).localeCompare(text(b.title), english ? 'en' : 'de') ||
        relationId(a.id).localeCompare(relationId(b.id))
    )
    .map((doc) => {
      if (doc.publicOnWebsite !== true) throw new Error('Course without website release rejected');
      // Shared identifier: the course lives under this name on the course platform.
      const platformSlug = publicSlug(doc.slug);
      if (english && (!text(doc.pathSlug).trim() || !text(doc.title).trim())) return undefined;
      const slug = english ? publicSlug(doc.pathSlug) : platformSlug;
      if (seen.has(slug)) throw new Error('Duplicate course slug');
      seen.add(slug);
      if (!text(doc.title).trim()) throw new Error('Course title required');
      const modules: { title: string; duration: number; objectives: string[] }[] = [];
      for (const raw of (Array.isArray(doc.modules) ? doc.modules : []).slice(0, 50)) {
        const module = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
        const duration = Number(module.duration);
        if (!text(module.title).trim() || !Number.isFinite(duration) || duration < 1) {
          // An untranslated module makes the English teaser incomplete; the German build must still fail loudly.
          if (english) return undefined;
          throw new Error('Invalid course module');
        }
        modules.push({
          title: text(module.title),
          duration,
          objectives: (Array.isArray(module.objectives) ? module.objectives : [])
            .map(text)
            .filter((objective) => objective.trim()),
        });
      }
      return {
        locale: english ? ('en' as const) : ('de' as const),
        id: relationId(doc.id),
        slug,
        title: text(doc.title),
        description: text(doc.description),
        modules,
        totalMinutes: modules.reduce((sum, module) => sum + module.duration, 0),
        url: english ? `/en/courses/${slug}` : `/kurse/${slug}`,
        /** The course itself (German) lives on the course platform behind its access link. */
        courseUrl: `${COURSES_ORIGIN}/${platformSlug}/`,
      };
    })
    .filter((course) => course !== undefined);
}
export type Course = ReturnType<typeof cmsCourses>[number];
