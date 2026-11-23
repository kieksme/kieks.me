import type { CmsBuildContent } from './payload-build';
import { publicSlug, relationId, text } from './payload-build';

/** Course platform that hosts the actual (access-protected) course content. */
export const COURSES_ORIGIN = 'https://kurse.kieks.me';

/**
 * Public course teasers. Only title, description and the module overview
 * (title, duration, objectives) ever reach the website; course texts and the
 * question pool are neither requested nor accepted here.
 */
export function cmsCourses(content: CmsBuildContent) {
  const seen = new Set<string>();
  return (content.site.courses ?? [])
    .slice()
    .sort(
      (a, b) => text(a.title).localeCompare(text(b.title), 'de') || relationId(a.id).localeCompare(relationId(b.id))
    )
    .map((doc) => {
      if (doc.publicOnWebsite !== true) throw new Error('Course without website release rejected');
      const slug = publicSlug(doc.slug);
      if (seen.has(slug)) throw new Error('Duplicate course slug');
      seen.add(slug);
      if (!text(doc.title).trim()) throw new Error('Course title required');
      const modules = (Array.isArray(doc.modules) ? doc.modules : []).slice(0, 50).map((raw) => {
        const module = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
        const duration = Number(module.duration);
        if (!text(module.title).trim() || !Number.isFinite(duration) || duration < 1)
          throw new Error('Invalid course module');
        return {
          title: text(module.title),
          duration,
          objectives: (Array.isArray(module.objectives) ? module.objectives : [])
            .map(text)
            .filter((objective) => objective.trim()),
        };
      });
      return {
        id: relationId(doc.id),
        slug,
        title: text(doc.title),
        description: text(doc.description),
        modules,
        totalMinutes: modules.reduce((sum, module) => sum + module.duration, 0),
        /** Pages on this site; the course itself lives on the course platform behind its access link. */
        url: `/kurse/${slug}`,
        courseUrl: `${COURSES_ORIGIN}/${slug}/`,
      };
    });
}
export type Course = ReturnType<typeof cmsCourses>[number];
