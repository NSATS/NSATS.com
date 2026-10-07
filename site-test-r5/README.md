# NSATS website — test build (review copy, 7 October 2026, revision 5)

**Review copy — draft text, not in force.** This is a test build for review. It is not owner approval of publication, not legal sign-off and not a production release. Every page carries `<meta name="robots" content="noindex, nofollow">` and shows the draft bar.

## What changed since revision 4

The text is final-8 with the 14 revised licensing pages from the licensing text round 3 (checked on 7 October 2026).

- **Revised pages:** How licensing works, Licensing enquiries (with the licensing privacy notice), Quantum and Geomagnetism evaluation, Implementation support, Company information and credentials, Due-diligence guidance, Enterprise Business Centre, Enterprise enquiries, and the five Licensee support pages (home, assistance, access, portal, onboarding).
- **Removed:** Joint development (`nsats/quantum/licensing/joint-development/`). It is in no menu and not in the sitemap or search.
- **Titles:** "Enterprise information and confidentiality requests" is now "Enterprise enquiries"; "Due-diligence documents" is now "Due-diligence guidance".
- **Placeholder tags:** the Licensee support pages and Due-diligence guidance no longer carry the "Placeholder page" tag.
- **Layout:** level-4 subheadings are supported, for the sections of the licensing privacy notice.
- **The other pages:** same content as revision 4, apart from the build label and the section lists that named Joint development.

## Start pages

| Page | Path |
|---|---|
| Site home | `index.html`, which forwards to `nsats/index.html` |
| All pages | `sitemap.html` |
| How licensing works | `nsats/licensing/how-it-works/index.html` |
| Licensing enquiries (privacy notice and inactive form preview) | `nsats/contact/licensing/index.html` |
| Enterprise Business Centre | `nsats/business-centre/index.html` |
| Enterprise enquiries (inactive form preview) | `nsats/business-centre/request/index.html` |
| Licensee support | `nsats/licensees/index.html` |
| Licensee onboarding | `nsats/licensees/onboarding/index.html` |
| Standalone themes and typography review page | `theme-review/index.html` |

## Forms

Every enquiry, application, account and subscription form is an inactive preview: it does not submit or store what is typed. The sign-in preview shows only the page's own messages. Like any website, the site makes ordinary requests to its own host; for example, the search box opens the site's search page with the search term in the address, and that page filters a local index in the browser.

## Fonts, cookies and outside services

- **Fonts:**
  - All fonts are served from this site.
  - IBM Plex Sans is the default.
  - NSATS Clear RC04 (Version 1.100) is a test release, offered through "Aa Font".
- **Cookies:** the site sets no cookie.
- **Saved choices:** the font choice and the colour preview are kept in the browser's local storage.
- **Outside services:** there are no analytics, no embedded media and no other third-party scripts.

This test host is not the production hosting. Do not use it for the hosting and cookie records that the privacy and cookie notices are waiting for.

## Review material

This review copy shows a draft bar, owner-review boxes and internal review notes (`review-notes/`).

## Paths

All links are relative, so the site works from any folder.
