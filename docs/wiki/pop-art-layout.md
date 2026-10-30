# Pop-Art responsive layout

The shared layout components implement the verified desktop and mobile Figma
geometry while keeping content, destinations and keyboard interactions intact.
The live, noindex example is available at `/docs/pop-art-layout`.

## Components and props

| Component       | Usage                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Heading`       | `level`, `size`, colors and optional `shadowSize`; semantic heading tags remain intact.                                                   |
| `Lead`          | Large text is 18/28 px on mobile and 22/32 px on desktop. Compact `m` and color tones remain available.                                   |
| `ServiceCard`   | Number, title, description, link and accent props; additional services need no component changes.                                         |
| `MarqueeBand`   | `sticker`, middle-dot-separated `text`, optional class. Mobile statements stack; desktop animation copies are hidden from screen readers. |
| `CtaSection`    | Title, optional text, CTA label/destination, optional email link. Decoration never occupies a leading content row.                        |
| `Flames`        | Optional class. Original desktop and mobile SVGs are selected through `picture`; no recoloring, stretching or shape animation.            |
| `ZigzagDivider` | Top/bottom colors and optional explicit height. Default is 18 px mobile and 26 px desktop.                                                |
| `Halftone`      | A top-edge origin fades vertically; top-right and left origins retain radial fading.                                                      |

## Geometry

At the 1440 px desktop target, the main hero heading reaches 96/92 px. On mobile
it is 52/52 px, with a 4 px hard shadow. The CTA heading is 48/50 px on mobile
and reaches 88/115 px at the desktop target. Explicit caller-supplied heading
shadow values continue to take precedence.

Mobile service cards use 40 px numbers, 20 px titles, 3 px number shadows and
6 px card shadows. Desktop cards retain 80 px numbers, 24 px titles and 8 px
card shadows. Hover shadows preserve the selected accent color.

The mobile attitude band uses three stacked 26/32 px statements. Its one
semantic paragraph remains available to assistive technology at desktop sizes;
repeated moving copies are decorative.

The CTA uses a 390×300 mobile halftone with 16 px pitch and a 1440×420 desktop
halftone with 24 px pitch. Both are absolutely positioned behind the content.
For the mobile pattern, first-row diameters are 8.76 px across the entire row:
`max(1.2, 9 - 0.03 * y)`. This is a top-edge origin, not a top-center radial
origin. Existing top-right hero patterns remain radial.

## Original flame assets

- Existing red desktop export: `655-1038_flammen-rot__imgFlammenRot.svg`, 1440×220.
- Original yellow desktop node655:1040: `655-1040_flammen-gelb-original.svg`, 1440×150.
- Original red mobile node658:1154: `658-1154_flammen-rot-mobile.svg`, 390×130.
- Original yellow mobile node658:1156: `658-1156_flammen-gelb-mobile.svg`, 390×90.

New exports were downloaded unchanged from the high-fidelity Figma context.
SVG root dimensions and paths are preserved. Responsive sources select the
correct native aspect ratio. The wrapper uses a new `pop-cta-flames` class to
avoid the legacy `pop-flames` gradient/clip-path rule in `kanten.css`.

These decorative flames are unrelated to the brand logo. The original circular
logo is managed separately and must never be replaced by a burst or jagged shape.

## Verification

Unit tests render the actual Astro components with AstroContainer. They check
semantic headings, custom props, accessible nonduplicated slogans, CTA actions,
original flame aspect ratios, and the numerical behavior of halftone fading.
Browser review at 390 and 1440 px is still required to verify final composed
geometry, light/dark colors and all existing page content.

Figma source: [kieks.me Website Mockup](https://www.figma.com/design/aoNyD9LUPkLYPWxswslRYF?node-id=652-2).
No Figma screenshot or short-lived asset URL is used as a runtime website asset.

The shared page scripts only apply the legacy menu reset when a legacy toggle
exists. The Pop-Art native details menu and theme controls stay visible after
viewport changes. This is covered by `header-navigation.test.ts` in addition
to the responsive browser check.
