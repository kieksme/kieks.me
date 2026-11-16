import type { CmsBuildContent } from './payload-build';
import { mapCmsMetadata, publicSlug, relationId, text } from './payload-build';
import { cmsAuthors, renderPublicRichText } from './cms-content';
import { safeHref } from './site-content';

/** Resolve trainer IDs exclusively against separately fetched, published public profiles.
 * Never trust populated relation objects or fetch private authentication users.
 */
export function cmsTrainings(content: CmsBuildContent) {
  const authors = cmsAuthors({
    ...content,
    authors: content.authors.filter((author) => author._status === 'published'),
  });
  const seen = new Set<string>();
  return (content.site.trainings ?? [])
    .slice()
    .sort(
      (a, b) =>
        (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || relationId(a.id).localeCompare(relationId(b.id))
    )
    .map((doc) => {
      if (doc._status !== 'published') throw new Error('Unpublished training rejected');
      const slug = publicSlug(doc.slug);
      if (seen.has(slug)) throw new Error('Duplicate training slug');
      seen.add(slug);
      if (!text(doc.title).trim() || !text(doc.summary).trim()) throw new Error('Training title and summary required');
      if (!Array.isArray(doc.trainers) || doc.trainers.length > 10) throw new Error('Invalid training trainers');
      const trainerIds = new Set(doc.trainers.map(relationId));
      const trainers = authors.filter((author) => trainerIds.has(author.id));
      // Withdrawing a public profile also removes its training from the next build.
      // This prevents accidental publication of a training with an unresolved trainer.
      if (!trainers.length || trainers.length !== trainerIds.size) return undefined;
      return {
        locale: content.locale ?? 'de',
        id: relationId(doc.id),
        slug: content.locale === 'en' ? publicSlug(doc.pathSlug) : slug,
        title: text(doc.title),
        summary: text(doc.summary),
        url: content.locale === 'en' ? `/en/trainings/${publicSlug(doc.pathSlug)}` : `/trainings/${slug}`,
        description: text(doc.description),
        descriptionHtml: renderPublicRichText(doc.descriptionRichText, content),
        duration: text(doc.duration),
        format: text(doc.format),
        deliveryLanguages: (Array.isArray(doc.deliveryLanguages) ? doc.deliveryLanguages : []).map((language) => {
          if (language !== 'de' && language !== 'en') throw new Error('Invalid training delivery language');
          return content.locale === 'en'
            ? language === 'de'
              ? 'German'
              : 'English'
            : language === 'de'
              ? 'Deutsch'
              : 'Englisch';
        }),
        trainers,
        requestUrl: doc.requestUrl ? safeHref(doc.requestUrl, false) : undefined,
        metadata: mapCmsMetadata(doc.seo, content),
      };
    })
    .filter((training) => training !== undefined);
}
export type Training = ReturnType<typeof cmsTrainings>[number];
