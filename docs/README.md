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


## v0.8
- Added student-specific reinforcement profiles.
- Baseline suppresses trial-by-trial reinforcement and error correction.
- Teaching sessions can use written praise or written praise with a gentle chime.
- Added student-specific praise text and feedback duration.
- Added a universal completion animation independent of accuracy.
- Added VISION.md to preserve the long-term roadmap.


## Documentation
- `docs/VISION.md` — long-term roadmap and future skill progression
- `docs/CHANGELOG.md` — release history
- `docs/InstructionalFramework.md` — assessment, prompting, and reinforcement principles


## v0.9
- Added student-specific fixed budgets.
- Added student-specific randomized budget ranges.
- Added whole-dollar or 50-cent budget increments.
- Budget settings are saved with each student profile.

## v0.10.1
- Restored the simpler v0.9 teacher workflow.
- Added Level 1: one-item affordability.
- Added Level 2: grocery-list affordability.
- Teachers choose 2–5 random items for Level 2.
- Students decide whether the total cost of the whole list fits their budget.


## v0.10.2
- Fixed a startup/navigation failure caused by mismatched cached HTML and JavaScript.
- Added cache-busting version tags for CSS and JavaScript.
- Added defensive initialization for new Level 2 controls.
- Corrected the Level 2 comparison band to show Total Cost.


## v0.12
- Added Level 3: Choose Items Within Budget.
- Teachers select how many items the student must choose.
- Students tap items to add or remove them from a cart.
- Cart Total and Money Left update immediately.
- Students submit the cart when the required number of items is selected.
- Teaching mode allows correction after an over-budget cart.
- Baseline records the first submitted cart without feedback.


## v0.12.1
- Fixed Level 3 so grocery choices are created before the cart screen renders.
- Cart item cards now appear immediately at the start of every Level 3 trial.
- Added cache-busting version tags for the hotfix.


## v0.12.2
- Fixed Level 3 visual prompting.
- The comparison band now shows the live Cart Total rather than the first grocery item.
- Cart Total updates inside the comparison band whenever the student selects or removes an item.
- The visual prompt remains available because it now accurately compares Cart Total with Budget.


## v0.12.3
- Level 3 trials are now guaranteed to have at least one valid cart solution.
- After grocery choices are generated, the app calculates the cost of the required number of cheapest items.
- If the student-profile budget is too low, the trial budget is automatically raised to that minimum solvable amount.
- This prevents students from becoming trapped in an impossible trial.


## v0.13
- Added Prompt Fading + Token Goal teaching procedure.
- Teachers select a programmed starting prompt: visual+audio, visual only, audio only, initial SD, or independent.
- Response buttons stay locked until the programmed prompt completes.
- Correct first responses earn tokens.
- Incorrect first responses receive a model correction and do not earn a token.
- Sessions end at the token goal or maximum-trial safeguard.
- Added optional local GIF/image reinforcement for each token and optional completion animation/audio.


## v0.13.1
- Restored core session rendering and reporting functions accidentally omitted from v0.13.
- Restored the two starter test profiles when missing.
- Fixed Begin Session for newly created students.
- Added correct token-goal and maximum-trial session stopping rules.


## v0.13.2
- Fixed token sessions failing immediately after Begin Shopping.
- Restored the comparison-band builder required by prompt-fading sessions.
- Comparison prompts now support single-item, grocery-list, and cart activities.
- Replaced a compatibility-sensitive string method.
- Improved the session-start error message so unrelated errors are not reported as grocery-data failures.


## v0.13.3
- Added a universal response delay before student response controls activate.
- Default delay is 2 seconds and can be customized from 0–10 seconds per student.
- Yes/No and Check My Cart remain disabled during the observation period.
- A subtle “Please look carefully...” message appears while controls are locked.
- Latency now begins when response controls activate.
- Prompt-fading audio levels keep controls locked long enough for the audio cue to finish.


## v0.13.4
- Fixed response controls activating before the universal delay or programmed token prompt finished.
- Removed competing unlock paths from Baseline, Least-to-Most, and Prompt-Fading procedures.
- The universal delay is now the single response-activation gate.
- Token audio levels remain locked for at least three seconds so the cue can finish.
- Latency begins only after the controls are truly enabled.


## v0.14
- Renamed the teacher area to Student Programs.
- Reorganized each student program into ABA-aligned collapsible sections.
- Added Program Information, Teaching Procedure, Skill Settings, SD/Prompting/Timing, Reinforcement, Error Correction, and Data Collection categories.
- Added richer student program cards showing level and teaching procedure.
- Preserved all v0.13.4 instructional logic and saved profile fields.


## v0.14.1
- Restored student loading and Student Programs navigation.
- Restored student editing, saving, deleting, and session launch functions accidentally omitted from v0.14.
- Preserved the new categorized ABA Student Program layout.


## v0.14.2
- Error Correction is now editable for each student program.
- Teachers can enable or disable modeling, required correction responses, token withholding, and continuation after correction.
- Data Collection is now configurable for each student.
- Selected data measures control what appears in teacher reports and exported summaries.
- Baseline continues to suppress error correction automatically.


## v0.14.3
- Added six original built-in reinforcement packages: Stars, Rockets, Dinosaurs, Rainbow, Trains, and Music.
- Added token and completion preview buttons.
- Added differential reinforcement choices.
- Added Independent Only token earning.
- Added a larger independent-response celebration option.
- Preserved custom GIF, animation, and sound paths.
- Baseline continues to suppress all trial-by-trial reinforcement.

## v0.14.4
- Added direct uploads for token images/GIFs, completion images/GIFs, and completion audio.
- Uploaded media is stored with the student program in the current browser.
- Relative project paths remain available for cross-device deployment.


## v0.14.5
- Fixed Custom Media upload controls being hidden inside the token-only settings container.
- Selecting Custom Media now reveals uploads for token animation, completion animation, and completion audio regardless of the selected teaching procedure.


## v0.15
- Added a classroom profile and lead-teacher field.
- Added a shared classroom staff directory.
- Staff can be active or inactive without losing historical records.
- The adult administering a session is selected before Begin Session.
- Administrator ID, name, and role are saved with each session.
- Reports can be filtered by administrator.


## v0.15.1
- Fixed the Student Programs button not opening the classroom interface.
- Added explicit references for the new Classroom tab and panel.
- Reordered teacher-screen navigation so the screen opens before the selected panel is rendered.
- Ensured administrator selectors are initialized when the app loads.


## v0.15.2
- Rebuilt Student Programs navigation so the teacher screen opens before any student data is rendered.
- Added a direct HTML fallback for the Student Programs button.
- Student profile rendering now happens after navigation and cannot prevent the screen from opening.


## v0.16
- Added a shared Classroom Reinforcement Library.
- Teachers can create, preview, edit, deactivate, and reuse reinforcement packages.
- A library package may include token media, completion media, completion audio, default praise, or project paths.
- Student programs reference shared classroom packages instead of duplicating media.
- Classroom backup and restore now include the classroom profile, staff directory, reinforcement library, students, and sessions.


## v0.16.1 Stability Release
This release centralizes teacher navigation and adds a visible **View Data** control for every saved session. A browser smoke test is included at `tests/navigation-smoke-test.html`.
