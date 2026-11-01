import { renderRichText } from '../components/editorial/rich-text';
import { mapCmsMetadata, publicSlug, relationId, resolvePublicMedia, text } from './payload-build';
import type { CmsBuildContent, CmsDocument } from './payload-build';
import type { Post, PublicAuthor } from '../types';

export function renderPublicRichText(value: unknown, content: CmsBuildContent): string {
  let remaining = 5000;
  function visit(value: unknown, depth = 0): unknown {
    if (!value || typeof value !== 'object' || depth > 24 || --remaining < 0) return undefined;
    const node = value as CmsDocument;
    if (node.type === 'upload' && node.relationTo === 'media') {
      const media = resolvePublicMedia(content, node.value);
      if (!media) return undefined;
      const ext = media.url.split('.').pop();
      return {
        type: 'upload',
        relationTo: 'media',
        value: {
          ...media,
          url: media.url.replace('/_cms-media/', '/api/media/file/'),
          mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        },
      };
    }
    if (node.type === 'link' || node.type === 'autolink') {
      const fields = node.fields && typeof node.fields === 'object' ? (node.fields as CmsDocument) : {};
      const url = text(fields.url ?? node.url);
      if (url.startsWith('/api/') || /^https:\/\/datahub\.kieks\.me(?:\/|$)/.test(url))
        throw new Error('Public content cannot link to private CMS endpoints');
    }
    return {
      ...node,
      children: Array.isArray(node.children) ? node.children.map((child) => visit(child, depth + 1)) : undefined,
    };
  }
  const input = value && typeof value === 'object' ? (value as CmsDocument) : {};
  return renderRichText({ root: visit(input.root) }).replaceAll('src="/api/media/file/', 'src="/_cms-media/');
}

export function cmsAuthors(content: CmsBuildContent): PublicAuthor[] {
  return content.authors.map((author) => ({
    id: relationId(author.id),
    name: text(author.name),
    slug: publicSlug(author.slug),
    url: `/blog/autoren/${publicSlug(author.slug)}`,
    bio: renderPublicRichText(author.bioRichText, content),
    avatar: resolvePublicMedia(content, author.avatar),
    contactEnabled: author.contactEnabled === true,
    metadata: mapCmsMetadata(author.seo, content),
  }));
}

export function cmsPosts(content: CmsBuildContent): Post[] {
  const authors = cmsAuthors(content);
  const seen = new Set<string>();
  return content.posts.map((post) => {
    const slug = publicSlug(post.slug);
    if (seen.has(slug)) throw new Error('Duplicate CMS post slug');
    seen.add(slug);
    const publishDate = post.publishedAt ? new Date(text(post.publishedAt)) : undefined;
    if (publishDate && !Number.isFinite(publishDate.valueOf())) throw new Error('CMS post publication date is invalid');
    const authorId = relationId(post.author),
      authorProfile = authorId ? authors.find((author) => author.id === authorId) : undefined;
    if (authorId && !authorProfile) throw new Error('Post references an unpublished or unavailable author');
    const category = text(post.category);
    return {
      id: `payload:${relationId(post.id)}`,
      slug,
      permalink: `blog/${slug}`,
      publishDate,
      updateDate: post.updatedAt ? new Date(text(post.updatedAt)) : undefined,
      title: text(post.title),
      excerpt: text(post.excerpt) || undefined,
      image: resolvePublicMedia(content, post.heroImage)?.url,
      author: authorProfile?.name || text(post.authorName),
      authorProfile,
      category: category
        ? {
            title: category,
            slug: category
              .normalize('NFKD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
          }
        : undefined,
      tags: Array.isArray(post.tags)
        ? post.tags
            .map((tag) => text((tag as CmsDocument)?.tag))
            .filter(Boolean)
            .map((tag) => ({
              title: tag,
              slug: tag
                .normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
            }))
        : [],
      metadata: mapCmsMetadata(post.seo, content),
      content: renderPublicRichText(post.contentRichText, content),
      draft: false,
    };
  });
}
