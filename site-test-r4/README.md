# NSATS website — test build (review copy, 6 October 2026, revision 4)

**Review copy — draft text, not in force.** This is a test build for review. It is not owner approval of publication, not legal sign-off and not a production release. Every page carries `<meta name="robots" content="noindex, nofollow">` and shows the draft bar.

## What changed since revision 3

The text now comes from final-8, which the owner approved as text on 6 October 2026. The legal pages and both recruitment privacy notices are still with the DIFC and Swiss lawyers.

- **Removed:** the Researchers and inventors page (`nsats/about/researchers/`). It is in no menu and not in the sitemap.
- **New:** ten vacancy pages under `nsats/careers/open-roles/`, and two recruitment privacy notices:
  - `nsats/careers/privacy/difc/`;
  - `nsats/careers/privacy/switzerland/`.
- **Changed:**
  - Current opportunities lists the ten vacancies in three groups.
  - Recruitment process, Application form, Careers enquiries, Privacy enquiries, MyNSATS, the privacy notice, the cookie notice and the website terms carry the final-8 text.
- **Vacancy pages:** each shows its reference, area, location, employment type and closing date in a panel under the introduction.
- **Footer:** "About" is the first link under "Company".
- **The other 188 pages:** same content as revision 3, apart from navigation and the footer.

## Start pages

| Page | Path |
|---|---|
| Site home | `index.html`, which forwards to `nsats/index.html` |
| All pages | `sitemap.html` |
| Current opportunities | `nsats/careers/open-roles/index.html` |
| A vacancy (Junior FPGA Developer) | `nsats/careers/open-roles/junior-fpga-developer/index.html` |
| DIFC recruitment privacy notice | `nsats/careers/privacy/difc/index.html` |
| Swiss recruitment privacy notice | `nsats/careers/privacy/switzerland/index.html` |
| Privacy notice | `nsats/trust/privacy/index.html` |
| Cookies and preferences | `nsats/trust/cookies/index.html` |
| Website terms | `nsats/trust/terms/index.html` |
| Privacy enquiries (inactive form preview) | `nsats/contact/privacy/index.html` |
| NSATS Design (colour themes and the NSATS Clear typeface) | `nsats/design/index.html` |
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
