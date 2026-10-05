# NSATS website — test build (review copy, 5 October 2026, revision 3)

This is a test build for review. It is not owner approval of the content, and it is not a production release. Every page carries `noindex,nofollow`, and `robots.txt` disallows crawling.

## What changed since revision 2

The text now comes from final-4, which the owner approved on 5 October 2026. Seven pages changed: About NSATS, Our story, Leadership, Governance, Sign in to MyNSATS, Create a MyNSATS account and MyNSATS. The other 191 pages have the same content as in revision 2.

- **Timeline (About NSATS, Our story):** 2019, 2020, 2021, 2022 and 2025, then two milestones marked "Year pending".
- **Sign in to MyNSATS:** you can type in the fields. "Sign in" never sends or stores anything. It always shows the access-by-approval message, with a link to request access.
- **MyNSATS:** a labelled preview of the signed-in page. "View Financial Results" is locked and is not a link. The two regional agreements are still pending, so there are no downloads.
- **Menu:** a new "MyNSATS" menu in the top bar links to the sign-in, account-request and MyNSATS pages.

## Start pages

| Page | Path |
|---|---|
| Site home | `index.html`, which forwards to `nsats/index.html` |
| All pages | `sitemap.html` |
| About NSATS (timeline) | `nsats/about/index.html` |
| Sign in to MyNSATS | `nsats/mynsats/sign-in/index.html` |
| MyNSATS (preview) | `nsats/mynsats/index.html` |
| NSATS Design (colour themes and the NSATS Clear typeface) | `nsats/design/index.html` |
| Standalone themes and typography review page (earlier review material, unchanged) | `theme-review/index.html` |

## Fonts

All fonts are self-hosted with the site. Nothing is loaded from an outside service.

**IBM Plex Sans**
- Light, Regular and SemiBold.
- The default font.
- Licence: SIL Open Font License 1.1 (`assets/fonts/LICENSE.txt`).

**NSATS Clear RC04 (Version 1.100)**
- Six styles.
- A test release, not production approved.
- A modified IBM Plex Sans derivative under the SIL Open Font License 1.1.
- Viewers can choose it with "Aa Font" in the top bar.
- The NSATS Clear page offers the font files for download, for testing only (`assets/design/*.zip`).

## Review material

This review copy shows a draft bar, owner-review boxes and internal review notes (`review-notes/`).

## Paths

All links are relative, so the site works from any folder.
