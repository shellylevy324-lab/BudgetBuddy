# Budget Buddy v0.6

## New
- Baseline mode with no automated prompts
- Least-to-most visual prompting
- Student-specific independent wait time
- Student-specific time between prompt levels
- Visual comparison prompt
- Gestural answer prompt
- Model answer prompt
- Prompt level reporting
- Independent-response percentage
- Post-prompt latency reporting
- Classroom backup export/import

## Prompt sequence
For Least-to-Most Visual Prompts:

1. Independent opportunity
2. Visual comparison prompt
3. Gestural answer prompt
4. Model answer prompt

## Moving data to another device
1. Open Teacher Platform.
2. Select Import / Export.
3. Export Classroom Backup.
4. Move the downloaded JSON file to the other device.
5. Open Budget Buddy there.
6. Import Classroom Backup.

This is manual transfer, not automatic cloud synchronization.

## Privacy
Use test names, initials, or approved student codes until your school has reviewed the data-handling process.


## v0.6.1
- Prompt backgrounds remain white across all prompt levels.
- Removed pulsing background changes.
- Added student-specific spoken SD setting.
- Added automatic audio for “Can I afford this item?”
- Added a Repeat audio button on the student activity.
- Audio uses the browser's built-in speech synthesis and does not require an audio file.


## v0.6.2 prompt sequence
1. Initial spoken SD: “Can I afford this item?”
2. Visual prompt: price and budget are highlighted and bolded
3. Secondary spoken prompt: “Look at your budget. Do you have enough to buy this item?”
4. Gestural prompt: hand icon points to the correct answer

The white background remains unchanged throughout the sequence.


## v0.6.3
- Price and budget displays enlarge during the visual prompt.
- Price and budget borders are thicker and more pronounced.
- Visual emphasis stays on screen through later prompt levels.
- The final correct answer enlarges substantially.
- The hand icon and enlarged answer remain until the student responds.
- Prompt emphasis is stable rather than pulsing.

## v0.6.4
- Added a single blue rounded comparison band spanning the page.
- Price and budget are shown side by side in that band.
- The comparison band stays visible through later prompt levels.
- Added a reliable hand element that moves into the correct answer button.
- The hand remains visible until the student responds.


## v0.6.5
- Converted the visual comparison prompt into one continuous blue rounded rectangle.
- Price and budget remain on the same horizontal line on laptop and desktop screens.
- Removed enlargement from the original price and budget cards so they no longer push outside the viewport.
- Added responsive sizing to prevent the comparison border from being clipped.
- On very narrow screens, the comparison values remain inside one rounded box and stack vertically.


## v0.6.6
- Replaced the emoji hand with a simple black line-drawing SVG.
- The hand is stored at `assets/images/prompts/pointing-hand.svg`.
- The hand points toward the enlarged correct answer and remains until the student responds.
- The graphic is intentionally simple so the answer button remains the primary focus.


## Version 0.7
- The pointing-hand graphic is now placed inside the correct answer button.
- The correct answer enlarges and remains enlarged until the student responds.
- The incorrect answer remains available but is slightly faded during the final prompt.
- The comparison band remains visible during later prompt levels.
- Prompt visuals are stable and do not pulse or flash.
- The final prompting sequence is:
  1. Spoken SD
  2. Unified visual price/budget comparison
  3. Secondary spoken cue
  4. Enlarged modeled answer with line-drawing hand


## Version 0.7.1
- Fixed a JavaScript syntax error that prevented students and navigation from loading.
- Restored the final hand prompt inside the correct answer button.


## v0.7.2
- Replaced the hand graphic with a simple blue/white instructional arrow inside the correct answer button.
- Preserved the unified comparison band, audio cue, enlarged correct answer, and faded incorrect answer.
- Removed dependency on the hand image for the final prompt.
