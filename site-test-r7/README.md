# NSATS website — test build (review copy, 8 October 2026, revision 7)

**Review copy — draft text, not in force.** This is a test build for review. It is not owner approval of publication, not legal sign-off and not a production release. Every page carries `<meta name="robots" content="noindex, nofollow">` and shows the draft bar.

## What changed since revision 6

- **Theme review link:** NSATS Design home now links to the standalone themes and typography review page (`theme-review/index.html`), with ChatGPT's wording: "Compare website themes and typography" (owner decision, 8 October 2026). The review page itself is unchanged.
- **Other files:** only NSATS Design home, the NSATS Design stylesheet and the search index changed. The theme review page is now part of the site build, in the same place as before.

## Revision 6 changes (still current)

NSATS Sans 1.203 is merged into the site and the themes (owner decisions of 7 and 8 October 2026). The ordinary pages retain revision 5's main content. The NSATS Design typeface wording and standalone theme-review wording have been updated for NSATS Sans 1.203.

- **Site font:** NSATS Sans 1.203 is the default. IBM Plex Sans is the alternative, offered through "Aa Font". NSATS Clear RC04 is no longer used.
- **NSATS Design:** the typeface page is now NSATS Sans, at `nsats/design/nsats-sans/`. The old address `nsats/design/nsats-clear/` forwards to it. The typeface wording was written by ChatGPT and approved by the owner on 8 October 2026.
- **Downloads:** the three official NSATS Sans 1.203 ZIPs and their SHA-256 files, unchanged copies of the public release (`assets/design/`).
- **Theme review page:** rebuilt with NSATS Sans as its default font and IBM Plex Sans as the alternative, with new wording from ChatGPT. Its colours are now shown as strips, as on the NSATS Design Colour page.
- **The other pages:** same content as revision 5, apart from the build label, the font dialog and the Developers menu line for NSATS Design.

## Start pages

| Page | Path |
|---|---|
| Site home | `index.html`, which forwards to `nsats/index.html` |
| All pages | `sitemap.html` |
| NSATS Design | `nsats/design/index.html` |
| NSATS Sans typeface | `nsats/design/nsats-sans/index.html` |
| Colour | `nsats/design/colour/index.html` |
| How licensing works | `nsats/licensing/how-it-works/index.html` |
| Licensing enquiries (privacy notice and inactive form preview) | `nsats/contact/licensing/index.html` |
| Enterprise Business Centre | `nsats/business-centre/index.html` |
| Licensee support | `nsats/licensees/index.html` |
| Standalone themes and typography review page | `theme-review/index.html` |

## Forms

Every enquiry, application, account and subscription form is an inactive preview: it does not submit or store what is typed. The sign-in preview shows only the page's own messages. Like any website, the site makes ordinary requests to its own host; for example, the search box opens the site's search page with the search term in the address, and that page filters a local index in the browser.

## Fonts, cookies and outside services

- **Fonts:**
  - All fonts are served from this site.
  - NSATS Sans 1.203 is the default.
  - IBM Plex Sans is the alternative, offered through "Aa Font".
- **Cookies:** the site sets no cookie.
- **Saved choices:** the font choice and the colour preview are kept in the browser's local storage.
- **Outside services:** there are no analytics, no embedded media and no other third-party scripts.

This test host is not the production hosting. Do not use it for the hosting and cookie records that the privacy and cookie notices are waiting for.

## Review material

This review copy shows a draft bar, owner-review boxes and internal review notes (`review-notes/`).

## Paths

Internal navigation and asset links are relative, so the site works from any folder; external links retain their full URLs.
