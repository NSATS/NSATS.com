NSATS SANS 1.203 — FONT DISTRIBUTION
Owner-approved release, 7 October 2026. Read RELEASE-NOTES.txt for status, test scope and known limitations.

You may download, install, use, copy and redistribute these fonts under the SIL Open Font License 1.1 (OFL.txt). Keep OFL.txt with every copy. The fonts may not be sold by themselves. The licence's conditions apply to the fonts; they do not extend to documents made with them.

Desktop, documents and print
Use the six files in fonts/ttf. Install them with your operating system's font manager; nothing installs automatically. Install only one copy of NSATS Sans at a time.
In Word-style menus choose "NSATS Sans" for Regular, Italic, Bold and Bold Italic, and "NSATS Sans SemiBold" for SemiBold and SemiBold Italic. Check that the real face is selected rather than a synthesized bold or italic.
In Microsoft Word, turn on "Kerning for fonts" (Format > Font > Advanced) so the spacing pairs take effect.
NSATS Sans was previously called NSATS Clear. Both can be installed at once. Documents set in NSATS Clear keep using NSATS Clear until you re-select NSATS Sans.
All six fonts have OS/2 fsType 0, so embedding in PDFs and documents is permitted. Export PDFs with fonts embedded and check the PDF's font list.

Website
Keep css/ and fonts/ together. Link css/nsats-sans.css and use font-family: var(--font-nsats) or the nsats-text class. Choose weights 400, 600 or 700 and normal or italic explicitly. Serve WOFF2 as font/woff2; configure CORS if the fonts are served from another origin. Publish each version under its own path and never overwrite an earlier version's files.
css/theme-tokens.css is optional and keeps the existing NSATS website palettes.

Reference page
index.html shows the six styles. It is a specimen, not a test result.

Developer kits
NSATS-Sans-1.203-Web-Kit.zip — for web developers: WOFF2 fonts, CSS with an optional metric-adjusted fallback, Sass, design tokens, Tailwind and Next.js set-up, examples and a loading test.
NSATS-Sans-1.203-Documents-Kit.zip — for documents, print and design: TTF fonts, install guides and scripts, Word and PowerPoint templates with kerning on, Office theme fonts, PDF/print examples (HTML, LaTeX, Node.js, Python), design-application guidance, a specimen and reference sheets.
See developers.html for details.

Integrity
SHA256SUMS.txt lists every file except itself. From this folder run: shasum -a 256 -c SHA256SUMS.txt
release.json lists the exact font files and their SHA-256 values.
