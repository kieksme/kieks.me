const excludedExactPaths = new Set(['/kontakt-erfolgreich', '/en/contact/success', '/services', '/contact', '/terms']);

const excludedPathSegments = ['/docs/', '/homes/', '/landing/', '/about', '/pricing', '/category/', '/tag/'];

export function shouldIncludeSitemapPage(page: string): boolean {
  const pathname = new URL(page, 'https://kieks.me').pathname.replace(/\/$/, '') || '/';
  return !excludedExactPaths.has(pathname) && !excludedPathSegments.some((segment) => pathname.includes(segment));
}
