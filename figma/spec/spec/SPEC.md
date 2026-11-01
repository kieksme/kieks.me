# kieks.me – Design-Spec (Pop-Art), aus Figma extrahiert

Quelle: Figma-Datei `aoNyD9LUPkLYPWxswslRYF` („NULLzuEINS – Design System“), Seite „kieks.me – Website Mockup“.
Frames: Startseite Desktop Light `652:2` (1440 × 6669), Startseite Desktop Dark `661:68`, Startseite Mobil Light `657:26` (390 × 8434), KI & MCP Desktop Light `659:84` (1440 × 4674). Dark-Varianten haben dieselbe Geometrie, nur die Tokens wechseln.

Das Dokument ist so geschrieben, dass man ohne Figma-Zugang danach bauen kann. Alle Maße sind in px bei 1440 px Breite. Die Referenzen liegen hier:
- `ref/*.tsx`: von Figma generierter React-und-Tailwind-Code pro Abschnitt, mit `data-node-id`. Er ist nur eine Vorlage. Er muss nach Astro und Tailwind übertragen und in Flex- oder Grid-Layout umgebaut werden.
- `ref/*_metadata.xml`: Knotenbaum mit x, y, Breite und Höhe für jeden Frame.
- `tokens.json`: Variablenwerte (Light und Dark) und Textstile, direkt aus `get_variable_defs`.
- `assets/`: originale SVG- und PNG-Exporte (Logo, Bursts, Finger, Zacken, Flammen, Avatar-Formen, Fotos, Pfeil, Karten-Halftone). Diese Dateien unverändert verwenden.
- `screens/`: PNGs der vollen Seiten und der einzelnen Abschnitte als visuelles Ziel.

> Rotation: Bei Figma- und CSS-Werten heißt positiv **im Uhrzeigersinn** (`rotate(3deg)` kippt die rechte Seite nach unten). Alle Werte unten sind CSS-Werte und wurden in den Screenshots geprüft.

---

## 1. Tokens

### 1.1 Farben (Collections „kieks.me Pop / Light“ und „kieks.me Pop / Dark“)

| Variable | Light | Dark | Verwendung |
|---|---|---|---|
| `pop/navy` | `#1e2a45` | `#1e2a45` | feste Markenfarbe (Text auf Gelb/Aqua, Schatten) |
| `pop/aqua` | `#00ffdc` | `#00ffdc` | Akzent, Schatten, Footer-Überschriften |
| `pop/fuchsia` | `#ff008f` | `#ff008f` | Akzent, Text-Schatten, CTA-Hintergrund |
| `pop/yellow` | `#ffd60a` | `#ffd60a` | Primär-Button, Sticker, Burst |
| `pop/purple` | `#9747ff` | `#9747ff` | Akzent (Karte 03, Marker, Schatten) |
| `pop/purple-deep` | `#7b2ff7` | `#7b2ff7` | Hintergrund CSP/„Nachweis“-Sektion, Box „ihre systeme“ |
| `pop/red` | `#e8202a` | `#e8202a` | Flammen (rot) |
| `pop/white` | `#ffffff` | `#ffffff` | Text auf Lila/Fuchsia |
| `ink` | `#1e2a45` | `#07090d` | **alle** Rahmen, Linien und Navy-Kartenschatten |
| `surface` | `#ffffff` | `#23262e` | Nav, Karten, Werkstatt, FAQ, Sprechblase |
| `page/bg` | `#f4f5f9` | `#12151c` | Leistungen-, Team- und „Was wir tun“-Hintergrund |
| `text/primary` | `#1e2a45` | `#f0f2f9` | Überschriften und Fließtext auf surface/page |
| `text/secondary` | `#4a5370` | `#b9bfcf` | Lead- und Body-Text |
| `text/link` | `#c8006f` | `#ff4fb0` | Textlinks „Mehr zu … →“ |
| `hero/bg` | `#00ffdc` | `#1e2a45` | Hero-Hintergrund |
| `hero/heading` | `#1e2a45` | `#00ffdc` | H1 |
| `hero/text` | `#1e2a45` | `#f0f2f9` | Hero-Lead |
| `hero/dots` | `#1e2a45` | `#00ffdc` | Halftone im Hero |
| `band/bg` | `#1e2a45` | `#00ffdc` | Haltung-Band, „So arbeiten wir“ |
| `band/text` | `#00ffdc` | `#1e2a45` | Text im Band |
| `note/bg` | `#fff3b0` | `#3a3420` | Platzhalter-Notizen (nur Vorschau) |
| `note/text` | `#5c4a00` | `#ffe27a` | Platzhalter-Text und gestrichelter Rahmen |
| `footer/bg` | `#1e2a45` | `#07090d` | Footer |
| `footer/text` | `#f0f2f9` | `#f0f2f9` | Footer-Text |

Empfehlung: als CSS-Custom-Properties anlegen (`--pop-navy`, `--ink`, `--surface` …), Dark über `[data-theme="dark"]` beziehungsweise `.dark` umschalten und in `tailwind.config` als Farben `pop.*`, `ink`, `surface`, `page` usw. mappen. **Wichtig:** Die farbigen Offset-Schatten wie `#ff008f` oder `#00ffdc` sind in beiden Modi gleich. Nur die navy Kartenschatten folgen `ink`, also `#07090d` im Dark Mode.

### 1.2 Typografie
Schriften: **Hanken Grotesk** (Black 900, ExtraBold 800, Bold 700) und **Source Sans 3** (Regular 400, SemiBold 600). Überschriften sind konsequent **kleingeschrieben** (das ist der Inhalt, kein text-transform; die Texte so übernehmen).

| Style (Figma) | Familie / Gewicht | Größe / LH | Letter-spacing |
|---|---|---|---|
| `kieks.me/Display/XL` (H1 Start) | Hanken Grotesk 900 | 96 / 92 | −2 % (−1.92px) |
| `kieks.me/Display/L` (H2, KI-H1) | Hanken Grotesk 900 | 64 / 64 | −2 % (−1.28px) |
| CTA-H2 Start | Hanken Grotesk 900 | 88 / normal (≈115) | 0 |
| CTA-H2 KI | Hanken Grotesk 900 | 68 / 72 | 0 |
| Haltung-Band | Hanken Grotesk 900 | 32 / normal | 0 |
| Kartennummer „01“ | Hanken Grotesk 900 | 80 / normal | 0 |
| Schritt-Nummer (KI) | Hanken Grotesk 900 | 44 / normal | 0 |
| Repo-Name | Hanken Grotesk 900 | 24 / normal | 0 |
| Team-Name „andrë“ | Hanken Grotesk 900 | 96 / normal | −5 % (−4.8px) |
| `kieks.me/Heading/S` (Karten-, FAQ-Titel) | Hanken Grotesk 800 | 24 / 30 | 0 |
| Button | Hanken Grotesk 800 | 18 (Nav 16, CTA 20) / normal | 0 |
| Sticker | Hanken Grotesk 800 | 16 (Team/FAQ 18, Band 20) | 0 |
| Textlink | Hanken Grotesk 800 | 16–18 | 0 |
| Nav-Link | Hanken Grotesk 700 | 17 | 0 |
| Footer-Spaltenkopf | Hanken Grotesk 900 | 20, `pop/aqua` | 0 |
| `kieks.me/Body/L` (Lead) | Source Sans 3 400 | 22 / 32 | 0 |
| `kieks.me/Body/M` (Body) | Source Sans 3 400 | 18 / 28 | 0 |
| Meta („GitHub · npm“) | Source Sans 3 600 | 16 | 0 |
| Footer-Link | Source Sans 3 400 | 17 (unten 16) | 0 |
| Notiz | Hanken 800 14 (Label) + Source Sans 400 15 | – | 0 |

**Text-Schatten (harte Offsets, kein Blur), Kennzeichen des Stils:**
- H1 Hero: `6px 6px 0 #ff008f`
- H2 auf hellem Grund: `4px 4px 0 #ff008f`
- H2 auf Lila (CSP/Nachweis): weiß mit `4px 4px 0 #1e2a45`
- H2 „so arbeiten wir“: aqua (`band/text`) mit `4px 4px 0 #ff008f`
- CTA-H2: weiß mit `7px 7px 0 #1e2a45` (Start, 88px) und `6px 6px 0 #1e2a45` (KI, 68px)
- Kartennummer: `4px 4px 0 #ff008f` (Details siehe 3.5)
- „mcp“ (KI-Hero-Art): weiß, 150px, `8px 8px 0 #00ffdc`
- Team-Name: navy und zusätzlich eine **aqua Kontur** von etwa 6px (`-webkit-text-stroke: 12px #00ffdc; paint-order: stroke fill;`)

### 1.3 Rahmen, Schatten, Ecken
- **Keine abgerundeten Ecken** (`border-radius: 0` überall). Kanten entstehen durch harte Rahmen und Offset-Schatten.
- Rahmen: Buttons, Sticker und Karten haben `3px solid ink`. Sprechblase und MCP-Schema-Boxen haben `4px`. Nav-Unterkante und Sektionsgrenzen haben `4px`. FAQ-Trennlinien haben `3px`. Notizen haben `2px dashed note/text`.
- Offset-Schatten (`box-shadow: Xpx Xpx 0 0 <farbe>`):
  - Sticker: `4px 4px 0 <aqua|fuchsia>`
  - Button: `6px 6px 0 <fuchsia|aqua>`
  - Repo-Zeile: `6px 6px 0` in Aqua, Fuchsia, Gelb und Lila (`#9747ff`), der Reihe nach
  - Service-Karte: `8px 8px 0 ink` (Karten 01–03) und `8px 8px 0 #ff008f` (Karte 04)
  - KI-Karte: `8px 8px 0` in Aqua, Fuchsia, Fuchsia und Lila
  - Schritt-Karte und Schema-Box: `8px 8px 0` mit eigener Akzentfarbe beziehungsweise ink
  - Sprechblase: `10px 10px 0 #00ffdc`
  - Burst-SVGs: Schatten `12px 12px` in Fuchsia (CSP) beziehungsweise Gelb (MCP), im SVG eingebacken
- Container: 1280 Inhalt, `px-80` (Desktop) und `px-20` (Mobil).

---

## 2. Rotationen (vollständige Liste)

| Element | Node | Rotation |
|---|---|---|
| Sticker „kieks.me GbR · Leipzig“ (Hero) | 652:895 | **3deg** |
| Sticker „unsere haltung“ (Band, auch mobil) | 652:918 / 657:691 | **4deg** |
| Sticker „Leistungen“ (Start) | 653:16 | **3deg** (aus der Bounding-Box berechnet und im Screenshot geprüft) |
| Sticker „Aus unserer Werkstatt“ | 653:818 | **−2deg** |
| Farbklecks-Quadrat 28×28 vor jedem Repo | 653:829 ff. | **−12deg** |
| Sticker „Unser Produkt“ (CSP) | 654:1660 | **3deg** |
| Text-Bubble „open source / MIT-Lizenz“ im CSP-Burst | 654:1671 | **6deg** |
| Sticker „Team“ | 654:1676 | **3deg** |
| Sticker „FAQ“ | 654:1693 | **3deg** |
| FAQ-Marker (Raute, Quadrat 18×18) | 654:1700 ff. | **−45deg** |
| Finger im Hero-Art | 652:909 | ≈ **−7deg** (im SVG `assets/652-907_hero-art__imgHeroArt.svg` eingebacken, nicht nachbauen) |
| Dark-Hero: Sticker „open source!“ auf dem Burst | 661:965 | **−8deg** (fehlt in der Light-Version!) |
| KI: Sticker „Leistung · KI & MCP“ | 659:957 | **3deg** |
| KI: „mcp“-Wortmarke im Burst | 659:965 | **8deg** |
| KI: Sticker „Grundlagen“ | 659:972 | **3deg** |
| KI: Schema-Box „ki-assistent“ | 659:977 | **3deg** |
| KI: Schema-Box „mcp-server“ | 659:981 | **−2deg** |
| KI: Schema-Box „ihre systeme“ | 659:985 | **2deg** |
| KI: Sticker „Leistungen“ | 659:988 | **−2deg** |
| KI: Sticker „Ablauf“ | 659:1018 | **3deg** |
| KI: Schritt-Karten 01 / 02 / 03 / 04 | 659:1022/1027/1032/1037 | **1.5deg / −1.5deg / 1.5deg / −1.5deg** (wechselnd) |
| KI: Sticker „Open Source“ (Nachweis) | 659:1752 | **3deg** |

Nicht gedreht sind: Buttons, Service-Karten der Startseite, Repo-Zeilen, Sprechblasen, Avatare, Bursts (Sterne sind achsensymmetrisch) und Notizen.

---

## 3. Startseite Desktop (652:2), Abschnitte von oben nach unten

y-Werte sind absolut im Frame. Bei Dividern gilt: Hintergrund = Farbe der Sektion **darüber**, Zackenfüllung = Farbe der Sektion **darunter** (siehe 3.3).

### 3.1 Header / Navigation (652:3, y 0, h 101), Screenshot `screens/652-3_navigation.png`
- `bg surface`, `border-bottom 4px ink`, `px 80, py 20`, `flex justify-between items-center`.
- Logo `assets/652-3_navigation__imgLogoKieksMeRed.svg` mit 224.8 × 44, im Dark Mode `655-1052_footer__imgLogoKieksMeRedDark.svg`.
- Links mit gap 32: „Leistungen ▾“ (Dropdown), „MCP-Server“, „CSP“, „Kontakt“ in Hanken 700 17 `text/primary`.
- Button „Erstgespräch buchen“: `bg pop/yellow`, `border 3 ink`, `px 26 py 15`, Hanken 800 16 navy, `shadow 6 6 0 #ff008f`, Größe 212 × 57.
- Mobil (657:27): h 77, `px 20 py 14`, Logo 173.7 × 34, Button „menü“ (gelb, Hanken 900 18, `px 12 py 8`, Rahmen 3, `shadow 4 4 0 #ff008f`).

### 3.2 Hero (652:23, y 101, h 868), `screens/652-23_hero.png`
- `bg hero/bg` (aqua beziehungsweise navy).
- **Halftone** (652:24): Box 620 × 560 rechts oben (x 820, y 0), siehe 5.1.
- Hero-Text (652:894) bei x 80, y 88, Breite 760, `flex-col gap 28`:
  1. Sticker „kieks.me GbR · Leipzig“: gelb, Rahmen 3, `px 14 py 8`, Hanken 800 16, `shadow 4 4 0 #ff008f`, **rotate 3deg**.
  2. H1 in 3 Zeilen („ihre software.“, „ihr code.“, „unsere erfahrung.“) mit Display/XL 96/92, `hero/heading`, `text-shadow 6 6 0 #ff008f`.
  3. Lead mit Body/L 22/32 `hero/text`, Breite 760.
  4. CTAs mit gap 20: Primär-Button gelb mit Fuchsia-Schatten („Erstgespräch buchen“, 231 × 59) und Sekundär-Button `surface` mit `shadow 6 6 0 #00ffdc` („Leistungen ansehen“). Beide Hanken 800 18, `px 26 py 15`, Rahmen 3.
  5. Notiz ⟦BESTÄTIGEN⟧, 520 breit (nur in der Vorschau).
- Hero-Art (652:907) mit 520 × 520 bei x 880, y 170, als **eine SVG** `assets/652-907_hero-art__imgHeroArt.svg`:
  - Gelber 24-zackiger Burst (500 × 500, Kontur 10 navy, Schatten fuchsia 12/12).
  - Fuchsia „Finger“ (Hand aus dem Logo) 400 × 277, gekippt (≈ −7deg), mit aqua Offset-Kopie dahinter.
  - Dark (661:962): getrennte Assets `661-962_hero-art-dark__imgBurstGelb.svg` und `…imgFingerMultiStacked.svg`, dazu der Sticker **„open source!“** (fuchsia, weiß, Hanken 900 24, `px 16 py 10`, Rahmen 3 ink, `shadow 5 5 0 #00ffdc`, **rotate −8deg**) bei left 330, top 26 im Art-Frame.

### 3.3 Divider „Zacken“ (652:914, 652:921, 654:1735, 654:1738, 656:26)
- Höhe 26 (mobil 18), volle Breite. Zähne als Dreiecke mit **Breite 52 und Höhe 26**, Spitze oben, Basis unten (`assets/652-914_divider-zacken__imgZacken.svg`: `M0 26V0L26 26L52 0 … L1430 26H1440Z`).
- CSS-Alternative: `background: <oben>; mask`/`clip-path` mit Dreiecksmuster, oder `background-image: linear-gradient(135deg, <unten> 25%, transparent 25%), linear-gradient(225deg, <unten> 25%, transparent 25%); background-size: 52px 52px; background-position: 0 0;` bei Höhe 26. Die Farbe wird über Props gesetzt.
- Farbpaare Light (oben → Zähne): Hero aqua → navy (Band); Band navy → `page/bg`; Werkstatt `surface` → purple-deep; CSP purple-deep → `page/bg`; FAQ `surface` → fuchsia (CTA).
- Dark: Hero navy → aqua (Band ist im Dark Mode aqua); Band aqua → `#12151c`; `#23262e` → purple-deep; purple-deep → `#12151c`; `#23262e` → fuchsia.
- Animations-Kandidat: langsames horizontales Wandern (`background-position-x` 0 → 52px, linear, infinite), mit `prefers-reduced-motion` aus.

### 3.4 Haltung-Band (652:917, h 116), `screens/652-917_haltung-band.png`
- `bg band/bg`, `px 80, pt 26, pb 30`, `flex items-center gap 24`.
- Sticker „unsere haltung“: fuchsia, Hanken 800 20, navy, `shadow 4 4 0 #00ffdc`, **rotate 4deg**.
- Text „einfach statt kompliziert · bewährt statt modisch · offen statt abhängig“ in Hanken 900 32 `band/text`, mit zwei Leerzeichen um den Punkt.
- Mobil (657:690): `flex-col gap 16`, `px 20 pt 28 pb 32`, Sticker 18px, Text 26/32 in 3 Zeilen mit Punkt am Ende jeder Zeile.
- **Marquee-Kandidat:** Den Text als endlos laufendes Ticker-Band umsetzen (Organism `Marquee`). Der Sticker bleibt fix links.

### 3.5 Leistungen (653:15, h 952), `screens/653-15_leistungen.png`
- `bg page/bg`, `px 80`, Sticker bei y 72.
- Sticker „Leistungen“: aqua, `shadow 4 4 0 #ff008f`, **rotate 3deg**. Darunter H2 „was wir für sie tun“ (Display/L, `text-shadow 4 4 0 #ff008f`), dann Lead 22/32 `text/secondary` mit Breite 760. Abstände: Sticker → H2 24, H2 → Lead 24, Lead → Karten 24.
- Karten (653:20): 4 Spalten zu je 297 mit gap 28 (x 0/325/650/975), Höhe 403, `items-start` (gleich hoch).
  - Karte: `bg surface`, Rahmen 3 ink, `shadow 8 8 0 ink` (Karte 04: `#ff008f`).
  - Kartenkopf mit Höhe 132, `border-bottom 3 ink`, `pl 24 pt 18`, Hintergrund **01 aqua / 02 fuchsia / 03 `#9747ff` / 04 yellow**.
    - Halftone im Kopf: Box 300 × 132 bei left 120, `opacity .25`, Punkte navy, siehe 5.1 (Asset `653-21_service-card__imgGroup.svg`).
    - Nummer in Hanken 900 80: 01 navy mit Fuchsia-Schatten, 02 navy mit **Aqua**-Schatten, 03 **weiß** mit Fuchsia-Schatten, 04 navy mit Fuchsia-Schatten (jeweils `4px 4px 0`).
  - Kartentext: `pt 22 pb 26 px 24`, gap 12; Titel Heading/S 24/30; Body/M 18/28 `text/secondary`; Link in Hanken 800 16 `text/link` „Mehr zu … →“.
- Notiz ⟦ENTSCHEIDUNG D6⟧ mit Breite 640, 24 unter den Karten.
- Mobil: Karten untereinander (gap 20), **horizontales Layout**: farbiger Kopf als linke Spalte (84 breit, Nummer 45 × 52, ca. 44px), Text rechts (254 breit, `p 16`).
- Hover-Kandidat: Karte `translate(-4px,-4px)` und Schatten auf 12/12 (Pop-„Lift“), oder Nummer kurz wackeln lassen.

### 3.6 Werkstatt / Open Source (653:816, h 605), `screens/653-816_open-source.png`
- `bg surface`, `border-top 4 ink`, `border-bottom 4 ink`, `px 80 py 96`, `flex items-center gap 64`.
- Links (flex 1, gap 24): Sticker „Aus unserer Werkstatt“ (gelb, `shadow 4 4 0 #00ffdc`, **rotate −2deg**), H2 „open source, öffentlich nachprüfbar“ (Display/L, Fuchsia-Schatten), Lead 22/32 secondary. Danach eine Zeile mit gap 24: Button **aqua** „Unsere MCP-Server ansehen“ (`shadow 6 6 0 #ff008f`) und der Link „Alle Projekte auf GitHub →“ (Hanken 800 18 `text/link`).
- Rechts „Repos“ mit Breite 560, `flex-col gap 18`, je eine Zeile `bg surface`, Rahmen 3, `px 20 py 16`, `justify-between`:
  - Links ein Farbklecks 28 × 28 (Rahmen 3 ink, **rotate −12deg**) plus „mcp-server · contabo“ (Hanken 900 24), gap 14.
  - Rechts „GitHub · npm“ (Source Sans 600 16 secondary).
  - Farbe je Zeile (Klecks = Schatten): contabo aqua, swetrix fuchsia, listmonk yellow, balena `#9747ff`; `shadow 6 6 0 <farbe>`.
- Animations-Kandidat: Klecks dreht beim Hover von −12° auf 0° beziehungsweise 12°; die Zeile verschiebt sich um 4px.

### 3.7 CSP – Produkt (654:856, h 752), `screens/654-856_csp.png`
- `bg pop/purple-deep #7b2ff7` (beide Modi). Halftone fuchsia (≈55 % Deckkraft) mit 700 × 560 rechts oben (x 740), siehe 5.1.
- Text (x 80, y 96, Breite 720, gap 24): Sticker „Unser Produkt“ (aqua, `shadow 4 4 0 #ff008f`, **rotate 3deg**); H2 in 3 Zeilen „csp: ein eigenes / serviceportal für / it-dienstleister“ (Display/L, **weiß**, `text-shadow 4 4 0 #1e2a45`); Lead 22/32 weiß; Button gelb „CSP kennenlernen“; Notiz D4.
- CSP-Art (654:1669) mit 440 × 400 bei x 864, y 176: Burst `assets/654-1669_csp-art__imgBurst.svg` (aqua, 16 Zacken, 400 × 400, Kontur 10 navy, **Fuchsia-Schatten 12/12**). Darauf die Bubble (**rotate 6deg**) mit „open source“ (Hanken 900 44 navy) über „MIT-Lizenz“ (Hanken 900 30), gap 2, zentriert, bei left 84, top 150.
- Animations-Kandidat: Burst dreht langsam (z. B. 60 s pro Umdrehung) oder pulsiert (`scale 1 → 1.04`), der Text bleibt fix.

### 3.8 Team – „wer dahintersteht“ (654:1674, h 776), `screens/654-1674_team.png`
- `bg page/bg`, `px 80 py 96`, `flex items-center gap 48`.
- Links (flex 1, ca. 392): Sticker „Team“ (fuchsia, Hanken 800 18, `shadow 4 4 0 #00ffdc`, **rotate 3deg**), H2 (2 Zeilen), Lead secondary, Notiz D10.
- Avatare (654:1683) mit gap 40, je eine Spalte von 400 (zentriert, gap 18):
  - Avatar-Box 361 × 499 (overflow hidden) aus vier Ebenen, von unten nach oben:
    1. Polygon grau `#D9D9D9` mit 341 × 448 bei (0, 9)
    2. dasselbe Polygon **fuchsia** bei (20, 4)
    3. dasselbe Polygon **aqua** bei (12, 15)
    4. freigestelltes Foto 311 × 440 bei (7, 0)
    - Polygon-Pfad: `assets/654-1674_team__imgVector1/2/3.svg` (identische Form, eine kantige „Schulter-Kopf“-Silhouette). Als `clip-path: polygon(...)` oder als Inline-SVG verwenden.
  - Name „andrë“ beziehungsweise „thomas“ in Hanken 900 96, tracking −4.8, navy mit aqua Kontur, zentriert bei left 181, top 379. Er überlappt das Foto unten, liegt also in der z-Order über dem Foto.
  - Fotos: `assets/654-1674_team__imgAndre1.png`, `…imgThomas.png` (Original: kieks.me.brand/source/avatars/).
  - Darunter eine Notiz D10 mit Breite 361.
- Animations-Kandidat: Die drei Polygon-Ebenen verschieben sich beim Hover gegeneinander (Parallax 4–8px). Der Name kann leicht kippen (−3°).

### 3.9 FAQ (654:1692, h 1133), `screens/654-1692_faq.png`
- `bg surface`, `border-top 4 ink`, `px 80 py 96`, `flex-col gap 24`.
- Sticker „FAQ“ (gelb, Hanken 800 18, `shadow 4 4 0 #ff008f`, **rotate 3deg**), H2 „häufige fragen“, Lead „Kurz und ehrlich beantwortet.“
- Zwei Spalten mit gap 64 (je ca. 608). Item: `py 24`, `border-bottom 3 ink`, `flex gap 20`. Marker ist ein Quadrat 18 × 18 mit Rahmen 3 ink, **rotate −45deg** (Raute), Farben der Reihe nach aqua, fuchsia, yellow, purple, dann wieder von vorn. Titel Heading/S, Antwort Body/M secondary, gap 8.
- Linke Spalte 4 Items, rechte Spalte 3 Items.
- Umsetzung als `<details>`-Akkordeon (mobil ist es in Figma als „Akkordeon“ benannt, 658:655). Desktop zeigt alles offen. Marker dreht beim Öffnen von −45° auf 45°.

### 3.10 Abschluss-CTA (655:15, h 832), `screens/655-15_cta.png`
- `bg pop/fuchsia`. Halftone `#9747ff` (≈50 %) über volle Breite × 420 von oben, siehe 5.1.
- H2 „lernen wir uns kennen“ in Hanken 900 88, weiß, `text-shadow 7 7 0 #1e2a45`, zentriert (y 100).
- Sprechblase (655:1043) mit 820 breit bei y 243: `bg surface`, **Rahmen 4 ink**, `shadow 10 10 0 #00ffdc`, `px 36 py 28`, gap 22, Text zentriert 22/32 `text/primary`. Darunter eine Zeile mit gap 28: Button gelb (Hanken 800 **20**, 251 × 62) und „Lieber per E-Mail: kontakt@kieks.me“ (Hanken 800 18 `text/link`).
- Notiz ⟦PLATZHALTER⟧ Buchungslink, 460 breit, y 515.
- **Flammen** am unteren Rand (z-Order: rot hinten, gelb vorn, beide unter dem Text):
  - rot `#e8202a`: 1440 × 220, y 612 (`assets/655-1038_flammen-rot__imgFlammenRot.svg`)
  - gelb `#ffd60a`: 1440 × 150, y 682 (gleiche Formsprache; das Asset wurde wegen des Figma-Rate-Limits nicht exportiert, siehe Screenshot)
  - Animations-Kandidat: Flammen „flackern“ (`scaleY 1 ↔ 1.06`, `transform-origin: bottom`, 1.2–1.8 s, ease-in-out, alternate, rot und gelb versetzt).

### 3.11 Footer (655:1052, h 404), `screens/655-1052_footer.png`
- `bg footer/bg`, `pt 72 pb 40 px 80`, `flex-col gap 48`.
- Oben: Logo (dunkle Variante) und darunter „kieks.me GbR · Leipzig“ (17), gap 16. Rechts 4 Spalten zu je 220 mit gap 32: Kopf Hanken 900 20 aqua, Links Source Sans 17 `footer/text`, gap 12. Inhalt: Leistungen (KI & MCP, Cloud & DevOps, Web- & Softwareentwicklung, Beratung & Workshops), Projekte (MCP-Server, Open Source auf GitHub), Produkt (CSP), Unternehmen (Kontakt, Erstgespräch buchen).
- Linie: 3px `pop/fuchsia` über die volle Breite.
- Unten `justify-between`, 16px: „© 2026 kieks.me GbR · Leipzig“ (400) und „Datenschutzerklärung · AGB · Impressum“ (600).

---

## 4. KI & MCP Desktop (659:84)
Navigation und Footer sind identisch mit der Startseite. Divider zwischen Hero → Was ist MCP, Was wir tun → So arbeiten wir, So arbeiten wir → Nachweis und Nachweis → CTA.

### 4.1 Hero (659:85, h 667)
- `bg hero/bg`, Halftone 620 × 560 rechts oben (wie auf der Startseite).
- Text (x 80, y 88, Breite 800, gap 28): Sticker „Leistung · KI & MCP“ (gelb, Fuchsia-Schatten, **3deg**). H1 „ki, die mit ihren systemen arbeitet, nicht an ihnen vorbei.“ in **64/64** Hanken 900 mit `text-shadow 6 6 0 #ff008f`. Lead 22/32. Button gelb „KI-Vorhaben besprechen“.
- Art (659:963) mit 460 × 440 bei x 928, y 110: Burst `assets/659-963_ki-hero-art-mcp__imgBurst.svg` (fuchsia, 420 × 420, Kontur navy, **gelber** Schatten). Darauf „mcp“ in Hanken 900 150, weiß, `text-shadow 8 8 0 #00ffdc`, navy Kontur, **rotate 8deg**, bei left 53, top 120.

### 4.2 Was ist MCP? (659:969, h 741)
- `bg surface`, `border-bottom 4 ink`, `px 80 py 96`. Text-Block 900 breit, gap 24: Sticker „Grundlagen“ (aqua, **3deg**), H2, Lead secondary.
- Schema (gap 14, 44 unter dem Text) mit drei Boxen zu je 220 breit, `py 26`, **Rahmen 4**, `shadow 8 8 0 ink`, Text Hanken 900 26 zentriert in 2 Zeilen:
  - „ki-assistent“ aqua mit **3deg**
  - Pfeil
  - „mcp-server“ gelb mit **−2deg**
  - Pfeil
  - „ihre systeme“ purple-deep mit weißem Text und **2deg**
- Pfeil: `assets/659-969_was-ist-mcp__imgPfeil.svg` mit 64 × 40, gelb, Kontur 4 navy.
- Animations-Kandidat: Pfeile „pulsieren“ nach rechts (`translateX 0 → 6px`). Die Boxen wackeln nacheinander (gestaffelter Wobble ±1°).

### 4.3 Was wir für Sie tun (659:987, h 703)
- `bg page/bg`, `px 80 py 96`, gap 24. Sticker „Leistungen“ (fuchsia, `shadow 4 4 0 #00ffdc`, **−2deg**). H2 „was wir für sie tun“.
- Karten: Raster 2 × 2 mit gap 28, `pt 12`. Karte `bg surface`, Rahmen 3, `overflow hidden`, `flex`. Links eine **Farbkante** mit 22 breit und voller Höhe. Inhalt `pt 24 pb 26 px 24`, gap 10, Titel Heading/S, Text Body/M.
- Farben (Kante / Schatten 8 8): MCP-Server aqua / aqua; Lokal oder als Dienst fuchsia / fuchsia; Agent-Skills **gelb / fuchsia**; Einordnung und Auswahl purple / purple.

### 4.4 So arbeiten wir (659:1017, h 592)
- `bg band/bg` (navy, dark aqua), `pt 72 pb 88 px 80`, gap 24. Sticker „Ablauf“ (gelb, **3deg**). H2 in `band/text` mit `text-shadow 4 4 0 #ff008f`.
- 4 Schritt-Karten (flex 1, gap 24, gleiche Höhe ca. 273): `bg surface`, Rahmen 3, `pt 22 pb 24 px 22`, gap 10, Schatten `8 8 0` in Aqua, Fuchsia, Gelb und Purple. **Rotation +1.5 / −1.5 / +1.5 / −1.5deg.**
  - Nummern-Badge: Rahmen 3, `px 12 py 2`, Hanken 900 44. Hintergrund = Akzentfarbe. Text navy, bei 04 weiß.
  - Titel Heading/S, Text Body/M secondary.
- Texte: 01 Verstehen, 02 Eingrenzen, 03 Umsetzen, 04 Übergeben.
- Animations-Kandidat: Beim Scroll-Reveal fallen die Karten nacheinander von 0° auf ihre Ziel-Rotation, oder sie richten sich beim Hover auf 0° auf.

### 4.5 Nachweis statt Versprechen (659:1045, h 634)
- `bg purple-deep`, Halftone fuchsia 700 × 480 rechts oben (Pitch 22).
- Sticker „Open Source“ (aqua, `shadow 4 4 0 #ff008f`, **3deg**) bei y 96. H2 „nachweis statt versprechen“ (weiß, `text-shadow 4 4 0 #1e2a45`), Lead 760 breit, Button gelb „Zu unseren MCP-Servern“ (265 × 59), Notiz (Belegstand) mit Breite 620.

### 4.6 Abschluss-CTA (659:1764, h 728)
- Wie 3.10. Halftone 1440 × 380. Flammen rot bei y 508 (h 220) und gelb bei y 578 (h 150).
- H2 in 2 Zeilen „haben sie ein system, mit / dem ihre ki sprechen soll?“ mit 68/72, weiß, `text-shadow 6 6 0 #1e2a45`.
- Sprechblase 760 breit, `px 36 py 26`, gap 20, nur ein Button.

---

## 5. Muster und Formen

### 5.1 Halftone-Punktraster (Kreise mit wachsender Größe)
Alle Raster sind regelmäßig (quadratischer Pitch). Der Punktdurchmesser nimmt **linear mit dem Abstand** zu einem Ursprung ab: `d = max(1.2, d0 − k · dist)`. Gemessen an allen Vektoren:

| Ort | Node | Box | Pitch | Ursprung (größte Punkte) | d0 / k | Farbe / Deckkraft |
|---|---|---|---|---|---|---|
| Hero Desktop (Start und KI) | 652:24, 659:86 | 620 × 560 rechts oben | 20 | **oben rechts** | 14.78 / 0.0180 | `hero/dots`, ca. 22 % (Light navy auf aqua, Dark aqua auf navy) |
| Service-Kartenkopf | 653:23 | 300 × 132, left 120 | 14 | **linke Kante** | 8.8 / 0.030 | navy, opacity .25 |
| CSP | 654:857 | 700 × 560 rechts oben | 22 | oben rechts | 15.8 / 0.0178 | fuchsia, ca. 55 % |
| KI Nachweis | 659:1046 | 700 × 480 rechts oben | 22 | oben rechts | 15.8 / 0.0188 | fuchsia, ca. 55 % |
| CTA | 655:16, 659:1765 | 1440 × 420 (KI 380) | 24 | **Oberkante** | 11.66 / 0.0286 | `#9747ff`, ca. 50 % |
| Mobil Hero / CSP | 657:42, 658:51 | 390 × 420 / 380 | 16 | oben rechts | 10.7 / 0.02 | wie Desktop |

Der erste Punkt sitzt jeweils etwa ½ Pitch vom Rand entfernt. Umsetzung: ein Atom `Halftone.astro`, das zur Build-Zeit ein SVG mit `<circle>`-Elementen erzeugt (Props: width, height, pitch, origin, d0, k, color, opacity). Alternativ `assets/653-21_service-card__imgGroup.svg` als Vorlage für die Kartenköpfe nutzen. **Nicht** mit einem gleichförmigen `radial-gradient` ersetzen, denn der Größenverlauf ist das Pop-Art-Merkmal.

### 5.2 Bursts / Starbursts (Sterne)
- Hero (gelb): 24 Zacken, r_außen 250, r_innen ≈ 200, Kontur 10 navy, Schatten fuchsia 12/12 (im SVG).
- CSP (aqua): 16 Zacken, 400 × 400, Kontur 10, Schatten fuchsia 12/12.
- KI-Hero (fuchsia): ca. 24 Zacken, 420 × 420, Kontur navy, Schatten **gelb**.
- Mobil: gelber Burst 285 × 285.
→ Die Assets aus `assets/` verwenden. Für die Animation das SVG in ein Wrapper-Element legen und **nur den Burst** rotieren (bei der Hero-SVG sind Burst und Finger zusammengefasst; für getrennte Animation die Dark-Assets `661-962_*` nehmen, die als zwei Dateien vorliegen).

### 5.3 Zackenkante und Flammen
Siehe 3.3 und 3.10.

### 5.4 Notizen (nur Vorschau)
Dashed-Box für ⟦BESTÄTIGEN⟧, ⟦PLATZHALTER⟧ und ⟦ENTSCHEIDUNG⟧: `bg note/bg`, `2px dashed note/text`, `px 14 py 10`, gap 4. Über ein Flag nur in der Deploy-Preview rendern.

---

## 6. Mobil (657:26), Kurzregeln
- Breite 390, Seitenrand 20, Inhalt 350. Divider 18 hoch.
- Sektionsabstände: Sticker beginnt meist bei y 56 (Desktop 72–100).
- H1 350 breit über 4 Zeilen (208 hoch, ca. 48–52/52). H2 ca. 36–40 mit LH 40 (Werkstatt-H2 3 Zeilen = 120). Lead 18/28.
- Hero: Halftone 390 × 420 oben, CTAs **untereinander** (gap 16), Hero-Art unter dem Text (350 × 300) mit Burst 285, Finger 250 × 173 und Sticker „open source!“ (auch im Light-Mobil).
- Leistungen: Karten horizontal (siehe 3.5). Repos 344 breit, Klecks 23.7.
- Team: Avatare untereinander. FAQ als Akkordeon.
- CTA: Halftone 300, Flammen rot 130 / gelb 90 hoch, H2 links 252 breit, Sprechblase 350.
- Footer 561 hoch, Spalten 2 × 2.

---

## 7. Animationen (Vorschläge, alle mit `@media (prefers-reduced-motion: reduce)` deaktivieren)
| Element | Animation |
|---|---|
| Sticker (alle) | `hover`: Rotation × 2 und `scale(1.05)`; beim Erscheinen „Stempel“-Effekt (`scale 1.3 → 1`, `rotate 0 → Ziel`, 250 ms, `cubic-bezier(.3,1.6,.5,1)`) |
| Buttons | `hover`: `translate(-2px,-2px)` und Schatten 8/8; `active`: `translate(4px,4px)` und Schatten 2/2 (eingedrückt) |
| Haltung-Band | Marquee, 30–40 s linear infinite, Text doppelt für einen nahtlosen Loop |
| Zacken-Divider | `background-position-x` wandert 52px pro 2 s (optional) |
| Bursts | `rotate` 0 → 360°, 40–60 s linear infinite; alternativ Pulse `scale 1 ↔ 1.04` |
| Finger | „Tipp“-Bewegung `translateX 0 → 10px → 0`, 1.6 s ease-in-out infinite |
| „mcp“ / „open source!“ | Wobble `rotate(Ziel ± 2deg)`, 3 s |
| Halftone | sehr langsames Drift (`translate 0 → pitch`), oder Fade-in beim Scrollen |
| Service-/Schritt-Karten | Scroll-Reveal gestaffelt (80 ms); Hover-Lift; Schritt-Karten richten sich auf 0° auf |
| FAQ-Marker | Raute dreht beim Öffnen (−45° → 45°) |
| Flammen | Flackern `scaleY`, rot und gelb phasenversetzt |
| Team-Avatar | Ebenen-Parallax beim Hover |
| Schema-Pfeile | `translateX` Puls nach rechts |

---

## 8. Atomic-Design-Inventar (Vorschlag für `src/components/`)

**Atoms** (`atoms/`)
| Komponente | Props | Figma-Nodes |
|---|---|---|
| `Button.astro` | `variant: primary(gelb)/secondary(surface)/aqua`, `shadow: fuchsia/aqua`, `size: sm(16)/md(18)/lg(20)`, `href` | 652:21, 652:900, 652:902, 653:823, 654:1664, 655:1046, 659:961 |
| `Sticker.astro` | `color: yellow/aqua/fuchsia`, `shadow`, `rotate` (deg), `size` | 652:895, 652:918, 653:16, 653:818, 654:1660, 654:1676, 654:1693, 659:957/972/988/1018/1752, 661:965 |
| `Heading.astro` | `level`, `size: xl/l/cta`, `color`, `shadowColor` (harter Text-Schatten) | 652:897, 653:18, 653:820, 654:1662, 654:1678, 654:1695, 655:1042, 659:959/974/990/1020/1754/2731 |
| `Lead.astro` / `Text` | `size: l/m`, `tone: primary/secondary/onColor` | 652:898 usw. |
| `TextLink.astro` | `arrow` | 653:218, 653:825, 655:1048 |
| `Marker.astro` | Raute 18 (FAQ) / Klecks 28 (−12°), `color` | 654:1700 ff., 653:829 ff. |
| `NumberBadge.astro` | `n`, `color`, `variant: big(80, im Kartenkopf)/boxed(44 mit Rahmen)` | 653:214, 659:1023 ff. |
| `Halftone.astro` | siehe 5.1 | 652:24, 653:23, 654:857, 655:16, 659:1046 |
| `Burst.astro` | `variant: hero/csp/mcp`, `spin` | 652:908, 654:1670, 659:964 |
| `ZigzagDivider.astro` | `top`, `bottom`, `height(26/18)` | 652:914 ff. |
| `Flames.astro` | – | 655:1038, 655:1040 |
| `Logo.astro` | `variant: light/dark`, `size` | 652:4, 655:1055 |
| `Icon` (Pfeil) | – | 659:979 |
| `Note.astro` (Platzhalter, nur Preview) | `label` | 652:904, 653:813, 654:1666 … |
| `ThemeToggle.astro` | – | (nicht in Figma; im Pop-Stil als kleiner Sticker-Button) |

**Molecules** (`molecules/`)
| Komponente | Figma |
|---|---|
| `ServiceCard.astro` (Kopf: Farbe, Halftone, Nummer; Text, Link; `layout: vertical/horizontal(mobil)`) | 653:21, 653:219, 653:417, 653:615; mobil 657:703 ff. |
| `FeatureCard.astro` (Farbkante 22 links) | 659:993, 659:998, 659:1004, 659:1009 |
| `StepCard.astro` (gedreht ±1.5°, NumberBadge) | 659:1022 ff. |
| `RepoRow.astro` | 653:827, 653:832, 653:837, 653:842 |
| `FaqItem.astro` (`<details>`) | 654:1699 ff. |
| `AvatarCard.astro` (3 Polygon-Ebenen, Foto, Name mit Kontur, Notiz/Bio) | 654:1684, 654:1688 |
| `SpeechBubble.astro` (Rahmen 4, Schatten aqua 10) | 655:1043, 659:2732 |
| `SchemaBox.astro` + Pfeil | 659:977, 659:981, 659:985 |
| `SectionIntro.astro` (Sticker, H2, Lead) | in jeder Sektion |
| `NavLinks` / `FooterColumn` | 652:16 / 655:1069 ff. |

**Organisms** (`organisms/`)
| Komponente | Figma |
|---|---|
| `Header.astro` (mit Mobil-Menü-Button „menü“) | 652:3, 657:27 |
| `Hero.astro` (Slots: Text, Art; Props: Halftone) | 652:23, 659:85 |
| `HeroArtFinger.astro` / `HeroArtMcp.astro` | 652:907 / 661:962, 659:963 |
| `MarqueeBand.astro` (Haltung) | 652:917 |
| `ServicesGrid.astro` | 653:15 |
| `OpenSourceSection.astro` | 653:816 |
| `CspTeaser.astro` (inkl. CSP-Burst) | 654:856 |
| `TeamSection.astro` | 654:1674 |
| `FaqSection.astro` | 654:1692 |
| `CtaSection.astro` (Halftone, Flammen, SpeechBubble) | 655:15, 659:1764 |
| `Footer.astro` | 655:1052 |
| KI-Seite: `McpExplainer.astro` (Schema), `FeatureGrid.astro`, `ProcessSteps.astro`, `ProofSection.astro` | 659:969, 659:987, 659:1017, 659:1045 |

**Templates/Pages:** `PageLayout.astro` (Header, Slot, Footer, Theme-Init) → `index.astro`, `ki-mcp.astro`. Alle Sektionen werden durch `ZigzagDivider` mit den Farbpaaren aus 3.3 getrennt.

---

## 9. Offene Lücken in dieser Spec
- Das Figma-MCP-Kontingent (Starter-Plan) war zwischendurch erschöpft. **Nicht** exportiert wurden das Asset „Flammen gelb“ (655:1040), die Hero-Halftone-SVG als Datei, Dark-Mode-Referenzcode pro Sektion (die Dark-Werte stammen aus den Variablen und den Screenshots) und die mobilen Sektionen über Nav und Band hinaus (die Maße stammen aus `ref/657-26_metadata.xml`).
- Die Halftone-Deckkraft wurde für Hero, CSP und CTA aus den Pixelfarben der Screenshots zurückgerechnet (±5 %). Im Kartenkopf ist sie exakt `.25`.
- Die Finger-Rotation von ≈ −7° wurde im Screenshot gemessen und ist im SVG eingebacken.
