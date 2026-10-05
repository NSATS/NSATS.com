# site-test

Test build of the NSATS website (text-only round), served by GitHub Pages at
https://nsats.github.io/NSATS.com/site-test/

- The existing site's files (everything outside this folder) must never be overwritten, renamed or deleted: the old site and its links are preserved and the new site co-exists with it. If a new file would collide with an existing path, the new file is renamed.
- Everything for the test build lives inside this folder.
- Every page carries `<meta name="robots" content="noindex, nofollow">`; the repo's `robots.txt` also blocks crawlers.
- Sessions that upload pages: commit only new or `site-test/` files, and check `git diff --name-status origin/main` shows no M/D/R on files outside `site-test/` before pushing.
