# Original circular logo

The header, footer and hero reuse the approved, unchanged
`kieks.me-single-circle.svg` from `kieksme/kieks.me.brand/assets/logos/`.
The square image is contained without clipping, masking, rotation or deformation.
The former jagged hero treatment is not used as a brand logo.

`Logo.astro` supports `variant` (auto/light/dark), `size` (sm/md/hero),
`layout` (`mark` or `horizontal`), `isAnimated` (default true) and `class`.
`mark` keeps the approved navy disc on light surfaces. On dark surfaces
(`variant="dark"`, or `auto` while the page is in dark mode) the same finger
uses `kieks.me-single-circle-dark.svg`. That disc has no solid fill, so the
hero halftone shows through, and an aqua ring (`#00FFDC`, 16px) keeps the
circle visible on navy. `horizontal`
shows the complete fuchsia wordmark: the light asset on light surfaces and the
dark asset when `variant` is `dark` or the page is in dark mode. The optional
entrance animates opacity only and is disabled for `prefers-reduced-motion: reduce`.

`HeroArtFinger.astro` retains its existing interface for callers and delegates
the artwork to `Logo` at hero size. Its separate open-source sticker remains
optional; the sticker never replaces or masks the logo.

The user's original-brand requirement overrides the old Figma hero artwork.
Other decorative bursts in product sections are independent illustrations.

Live examples: `/docs/pop-art-logo` (excluded from indexing).
Tests: `test/unit/components/logo.test.ts` verify the approved Git blob,
all theme variants, compact/static sizing and the absence of substitute hero art.
