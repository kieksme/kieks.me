// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite/client" />
/// <reference types="../vendor/integration/types.d.ts" />

interface SwetrixClient {
  init: (projectId: string) => void;
  trackViews: () => void;
}

interface Window {
  swetrix?: SwetrixClient;
}
