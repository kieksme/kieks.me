import type { APIRoute } from 'astro';
import { PreviewError, privateHeaders } from '../../lib/security';
import { serveSite, verifySiteRequest } from '../../lib/site';

export const prerender = false;

/** Signed GET only; the public bridge authenticates the human session and signs each forwarded request. */
export const GET: APIRoute = async ({ request }) => {
  try {
    const pathname = verifySiteRequest(request, process.env.DATAHUB_PREVIEW_SECRET);
    return await serveSite(pathname);
  } catch (error) {
    return new Response('Preview unavailable', {
      status: error instanceof PreviewError ? error.status : 500,
      headers: privateHeaders,
    });
  }
};
export const ALL: APIRoute = () => new Response('Preview unavailable', { status: 404, headers: privateHeaders });
