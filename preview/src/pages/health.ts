import { privateHeaders } from '../lib/security';
/** Internal-only liveness/configuration probe: no CMS access or sensitive values. */
export function GET() {
  const isReady =
    typeof process.env.DATAHUB_PREVIEW_SECRET === 'string' && process.env.DATAHUB_PREVIEW_SECRET.length >= 32;
  return new Response(JSON.stringify({ status: isReady ? 'ok' : 'unavailable' }), {
    status: isReady ? 200 : 503,
    headers: { ...privateHeaders, 'Content-Type': 'application/json' },
  });
}
