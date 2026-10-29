NSATS CLEAR 1.100 — FINAL FONT DISTRIBUTION
Approved by the owner on 6 October 2026. Read RELEASE-NOTES.txt for retained compatibility limitations.

Desktop, documents and professional print
Use the six fonts/ttf files. Install through your operating system's normal font manager when required; this package does not install anything automatically. Remove conflicting older copies only after preserving any needed test evidence.
In Word-style menus use NSATS Clear for Regular/Italic/Bold/Bold Italic and NSATS Clear SemiBold for the SemiBold pair. Check that the actual supplied faces are selected instead of synthesized bold/italic.
All six fonts have OS/2 fsType=0; embedding is permitted by those flags and the OFL. Actual embedding must still be enabled/verified in the target document/export application. Export PDF with fonts embedded and inspect the PDF font list, glyph coverage, line breaks and a physical proof. Vector font outlines are not fixed-resolution bitmaps; there is no separate “300 dpi font”. No OTF, printer profile or broadcast certification is implied.

Website
Keep css/ and fonts/ together. Link css/nsats-clear.css. Use font-family: var(--font-nsats) or the nsats-text class. Explicitly choose 400/600/700 and normal/italic. Use 400 rather than requesting an unavailable Light 300. Serve WOFF2 with the appropriate MIME type and, if using another origin, configure font CORS. Deploy to a versioned path and verify the downloaded hashes. Do not overwrite an old version's files with changed bytes.
Optional css/theme-tokens.css preserves the existing cyan, carbon and royal website palettes; it does not introduce a new palette approval. Existing IBM Plex headings used weight 300; switching them to NSATS Clear 400 requires checking line breaks and layout.

Reference page
Open index.html to view the six styles and implementation details. It is a static reference, not a test certification. Any browser rendering performed locally is a separate result to record.

Integrity
SHA256SUMS.txt lists every distribution file except itself. From this folder, check with shasum -a 256 -c SHA256SUMS.txt. release.json identifies the exact approved font bytes. Keep OFL.txt with redistributed fonts.
