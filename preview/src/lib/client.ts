/** Runs only in the authenticated same-origin iframe. Never receives any API key. */
export function isPreviewMessage(
  event: MessageEvent,
  origin: string,
  parentWindow: Window,
  collection: string
): boolean {
  return (
    event.origin === origin &&
    event.source === parentWindow &&
    event.data &&
    typeof event.data === 'object' &&
    event.data.type === 'payload-live-preview' &&
    event.data.collectionSlug === collection &&
    event.data.data &&
    typeof event.data.data === 'object' &&
    !Array.isArray(event.data.data)
  );
}
export function startPreview(windowObject: Window = window) {
  const document = windowObject.document;
  const collection = document.body.dataset.previewCollection;
  const id = document.body.dataset.previewId;
  if (!collection || !id || windowObject.parent === windowObject) return;
  let timer: ReturnType<typeof setTimeout>,
    active: AbortController | undefined,
    revision = 0;
  const status = (text: string) => {
    const el = document.getElementById('preview-status');
    if (el) el.textContent = text;
  };
  windowObject.addEventListener('message', (event: MessageEvent) => {
    if (!isPreviewMessage(event, windowObject.location.origin, windowObject.parent, collection)) return;
    const currentRevision = ++revision;
    clearTimeout(timer);
    active?.abort();
    let body: string;
    try {
      body = JSON.stringify({ document: event.data.data });
    } catch {
      return;
    }
    if (new TextEncoder().encode(body).length > 256 * 1024) {
      status('Inhalt zu groß für die Vorschau');
      return;
    }
    timer = setTimeout(async () => {
      active = new AbortController();
      status('Vorschau wird aktualisiert …');
      try {
        const response = await windowObject.fetch(
          `/preview/${encodeURIComponent(collection)}/${encodeURIComponent(id!)}`,
          {
            method: 'POST',
            credentials: 'same-origin',
            redirect: 'error',
            headers: { 'Content-Type': 'application/json' },
            body,
            signal: active.signal,
          }
        );
        if (!response.ok || !(response.headers.get('content-type') || '').startsWith('text/html')) throw Error();
        const html = await response.text();
        if (currentRevision !== revision) return;
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const next = parsed.getElementById('preview-content'),
          current = document.getElementById('preview-content');
        if (!next || !current || next.querySelector('script,iframe,object,embed,base')) throw Error();
        // Only the trusted server-rendered content changes; the listener is not reset.
        current.replaceChildren(...Array.from(next.childNodes));
        status('Ungespeicherte Änderungen · nicht veröffentlicht');
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError') && currentRevision === revision)
          status('Vorschau nicht verfügbar · Sitzung prüfen');
      }
    }, 250);
  });
  windowObject.parent.postMessage({ type: 'payload-live-preview', ready: true }, windowObject.location.origin);
}
if (typeof window !== 'undefined') startPreview();
