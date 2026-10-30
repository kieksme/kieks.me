# Original circular logo

The header, footer and hero reuse the approved, unchanged
`kieks.me-single-circle.svg` from `kieksme/kieks.me.brand/assets/logos/`.
The square image is contained without clipping, masking, rotation or deformation.
The former jagged hero treatment is not used as a brand logo.

`Logo.astro` supports `variant` (auto/light/dark), `size` (sm/md/hero),
`isAnimated` (default true) and `class`. The full-colour artwork is intentionally
identical in all themes. The optional entrance animates opacity only and is
disabled for `prefers-reduced-motion: reduce`.

`HeroArtFinger.astro` retains its existing interface for callers and delegates
the artwork to `Logo` at hero size. Its separate open-source sticker remains
optional; the sticker never replaces or masks the logo.

The user's original-brand requirement overrides the old Figma hero artwork.
Other decorative bursts in product sections are independent illustrations.

Live examples: `/docs/pop-art-logo` (excluded from indexing).
Tests: `test/unit/components/logo.test.ts` verify the approved Git blob,
all theme variants, compact/static sizing and the absence of substitute hero art.
