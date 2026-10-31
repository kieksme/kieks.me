import type { Post, PublicAuthor } from '../types';
export const siteUrl = (value: string) => new URL(value, 'https://kieks.me').href;
export const serializeStructuredData = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
export function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: siteUrl(item.url),
    })),
  };
}
export function personData(author: PublicAuthor) {
  return {
    '@type': 'Person',
    '@id': `${siteUrl(author.url)}#person`,
    name: author.name,
    url: siteUrl(author.url),
    ...(author.avatar ? { image: siteUrl(author.avatar.url) } : {}),
    worksFor: { '@id': 'https://kieks.me/#organization' },
  };
}
export function articleData(post: Post) {
  return {
    '@type': 'BlogPosting',
    '@id': `${siteUrl(post.permalink)}#article`,
    url: siteUrl(post.permalink),
    mainEntityOfPage: siteUrl(post.permalink),
    headline: post.title,
    description: post.excerpt,
    ...(post.publishDate ? { datePublished: post.publishDate.toISOString() } : {}),
    ...(post.updateDate && Number.isFinite(post.updateDate.valueOf())
      ? { dateModified: post.updateDate.toISOString() }
      : {}),
    ...(typeof post.image === 'string' ? { image: siteUrl(post.image) } : {}),
    ...(post.authorProfile
      ? { author: personData(post.authorProfile) }
      : post.author
        ? { author: { '@type': 'Person', name: post.author } }
        : {}),
    publisher: { '@id': 'https://kieks.me/#organization' },
  };
}
