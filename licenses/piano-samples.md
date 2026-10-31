# Piano samples

The piano sound of the app (`public/piano/*.mp3`) is made from one sample set. Policy: only a set whose own source page says CC0 or public domain (see "Sample licence policy" in `specs/tech-stack.md`).

## Source

- **Set:** Upright Piano KW, version 2022-02-21
- **Page:** https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html (section "Upright Piano KW")
- **Archive used:** `UprightPianoKW/UprightPianoKW-SFZ+FLAC-20220221.7z` (SFZ + FLAC, 2 velocity layers, 32 MiB)
- **Recorded by:** Gonzalo and Roberto, January 2017, with a Zoom H1 portable recorder; cropped, edited, and processed by Roberto. Thanks to Inma Martínez de Miguel for letting them record the piano in her home.
- **The piano:** the page says "Created from a Kawai upright piano located in a living room." (Kawai is a trademark of its owner; it is named here only to say what was recorded. The app is not made, sponsored, or endorsed by Kawai.)
- **Licence, verbatim from the page:** "Published under the terms of the Creative Commons CC0 1.0 public domain dedication." (https://creativecommons.org/publicdomain/zero/1.0/). The archive's own `readme.txt` says the same ("Published under the terms of Creative Commons CC0 public domain dedication") and includes the CC0 1.0 legal code.
- **Checked:** 2026-10-31, by reading the page and the archive's `readme.txt` and `cc0.txt`.

## What CC0 covers

CC0 waives copyright and related rights: no attribution or share-alike is required (the credits in the README are a courtesy). It does not waive patent or trademark rights. A recording of a sound is not patentable, so no patent applies to the samples. "Public domain" is the publisher's declaration, not a legal guarantee.

## Changes made

The files in `public/piano/` are modified copies of the original FLAC files, made by `scripts/build-piano-samples.ts`: leading silence trimmed, each sample cut to a length by register with a fade-out, volume levelled, and encoded to MP3. The modified files are shared under the same CC0 terms.

The conversion used ffmpeg (LGPL / GPL) once, on the developer's machine. ffmpeg is not part of the app, and its licence does not apply to the output files. The browser decodes the MP3 files itself.
