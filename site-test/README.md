# NSATS website — test build (review copy, 5 October 2026)

This is a test build for review. It is not owner approval of the content, and it is not a production release. Every page carries `noindex,nofollow`, and `robots.txt` disallows crawling.

## Start pages

| Page | Path |
|---|---|
| Site home | `index.html`, which forwards to `nsats/index.html` |
| All pages | `sitemap.html` |
| Themes section (three colour themes, typography, font option) | `nsats/developers/themes/index.html` |
| Standalone themes and typography review page | `theme-review/index.html` |

## Fonts

All fonts are self-hosted with the site. Nothing is loaded from an outside service.

**IBM Plex Sans**
- Light, Regular and SemiBold.
- The default font.
- Licence: SIL Open Font License 1.1 (`assets/fonts/LICENSE.txt`).

**NSATS Clear RC04 (Version 1.100)**
- Six styles.
- A test release, not production approved.
- A modified IBM Plex Sans derivative under the SIL Open Font License 1.1 (`assets/fonts/nsats-clear/OFL.txt`).
- Viewers can choose it with "Aa Font" in the top bar. The choice is stored only in their browser.

## Review material

This review copy shows a draft bar, owner-review boxes and internal review notes (`review-notes/`).

## Paths

All links are relative, so the site works from any folder, including a GitHub Pages project address.
