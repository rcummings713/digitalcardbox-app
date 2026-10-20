# Original motion stickers

Six original vector illustrations are defined in `scripts/generate-stickers.py`.
Each has a static SVG poster and a 16-frame GIF. Those six stickers contain no third-party media.
The UI shows posters by default, including in search, and loads an animation
only after a person chooses Play. Reduced-motion mode keeps posters still.

Regeneration requires Pillow, Node, Playwright and Chrome. Asset tooling is not
loaded by the web application.
Future licensed catalog search, attribution, moderation and export rights are
tracked separately in DCB-E12-S05 and DCB-E15-S04.


`cosmic.gif` is a byte-for-byte copy of the owner-supplied `tmp.gif` added for
the baby-card preview on 18 October 2026. Its original visible attribution is
retained. `cosmic-poster.png` is its first-frame still produced with macOS sips.
It is searchable/selectable in the same-origin catalog; browsers never fetch
arbitrary GIF URLs or a third-party search API. The opening home preview plays
briefly once (under five seconds) unless motion is reduced; guest search/composer
animations remain opt-in. A supplied reference is not a blanket export-license
claim; production catalog licensing stays with the existing media stories.
