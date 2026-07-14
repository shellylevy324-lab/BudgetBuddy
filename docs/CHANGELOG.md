# Budget Buddy Changelog

## v0.15.2 — Robust Student Programs Navigation

### Fixed
- Student Programs could remain on the home screen when profile rendering raised an error
- The teacher screen now opens first and loads student content afterward
- Added a direct button fallback independent of the normal event-binding sequence
- Navigation errors are logged without blocking access to the teacher screen

---


## v0.15.1 — Student Programs Navigation Fix

### Fixed
- Student Programs button did not navigate away from the home page
- Classroom tab and panel were not explicitly connected in JavaScript
- Administrator selectors now initialize when the application loads
- Teacher-screen navigation is more resilient

### Preserved
- Classroom profile and staff directory
- Session administrator selection
- Student Programs
- Reports and administrator filtering
- Existing student and session data

---


## v0.15 — Classroom Framework

### Added
- Classroom profile
- Lead teacher
- Shared staff directory
- Staff roles and active/inactive status
- Required session-administrator selection
- Administrator details in session records
- Administrator report filter

### Design Direction
The classroom owns student programs, reinforcement resources, staff information, sessions, reports, and backups. Staff are attached to sessions as administrators rather than owning separate copies of data.

---


## v0.14.5 — Visible Custom Uploads

### Fixed
- Custom upload fields were nested inside token-only settings and could remain hidden
- Selecting Custom Media now immediately displays all three upload controls
- Custom media can be configured for Least-to-Most or Prompt Fading + Tokens

---


## v0.14.4 — Custom Reinforcement Uploads

### Added
- Direct token image/GIF upload
- Direct completion image/GIF upload
- Direct completion audio upload
- File validation, size limits, upload status, and clear controls

### Storage Note
Uploaded files remain in the current browser. Use project paths for reliable cross-device use.

---


## v0.14.3 — Reinforcement Packages

### Added
- Super Stars package
- Rocket Adventure package
- Dino Celebration package
- Rainbow Party package
- Train Time package
- Music Celebration package
- Token preview
- Completion preview
- Original package sounds generated in the browser
- Differential reinforcement settings

### Differential Reinforcement
- Token for every correct first response
- Token for independent correct responses only
- Token for all correct responses with a larger independent celebration

### Preserved
- Custom reinforcement media paths
- Baseline suppression of reinforcement
- Token goals and maximum-trial safeguards
- Editable error correction and data collection
- Levels 1–3

---


## v0.14.2 — Editable Protocol Options

### Added
- Editable Error Correction checkboxes
- Editable Data Collection checkboxes
- Student-specific saved protocol choices
- Report visibility based on each student’s selected measures

### Error Correction Options
- Model the correct response
- Require completion of the modeled response
- Withhold or award a token after correction
- Continue or end the session after correction

### Data Options
- Accuracy
- Latency
- Prompt level
- Independent responses
- Tokens
- Corrected responses
- Cart attempts
- Yes / No response distribution

### Preserved
- Baseline suppression of error correction
- Existing student programs and stored data
- Levels 1–3
- Prompting, token, and reinforcement procedures

---


## v0.14.1 — Student Program Navigation Fix

### Fixed
- Student records were not displayed because core student-program functions were omitted
- Home navigation buttons could not launch Student Programs or shopping sessions
- Restored student editing, saving, deletion, grocery loading, and session welcome behavior

### Preserved
- Existing browser-saved students and sessions
- Starter test students
- Categorized ABA Student Program layout
- All v0.13.4 instructional procedures

---


## v0.14 — ABA Student Program Builder

### Changed
- Renamed Teacher Platform to Student Programs
- Reorganized student editing into collapsible ABA teaching-protocol categories
- Updated labels to use instructional language such as Teaching Procedure, SD, Response Delay, and Celebration Duration
- Added richer student program cards showing skill level and teaching procedure
- Added dynamic SD preview based on the current skill level

### Preserved
- Baseline, least-to-most, and prompt-fading token logic
- Levels 1–3
- Universal response delay
- Reinforcement media paths and token goals
- Reports, data export, and classroom backup

---


## v0.13.4 — Response Lock Hotfix

### Fixed
- Yes/No controls could activate immediately despite the student response-delay setting
- Prompt scheduling and universal delay previously used competing unlock paths
- Token prompt profile keys were mismatched in the delay calculation
- Token audio prompts now finish before controls activate
- Latency begins at the actual response opportunity

---


## v0.13.3 — Universal Response Delay

### Added
- Student-specific response delay from 0–10 seconds
- Default 2-second observation period
- Disabled response controls during observation
- Subtle “Please look carefully...” message
- Visual ready-state transition

### Changed
- Latency begins when response controls activate
- Token prompt-fading levels with audio keep controls disabled until the cue is complete

### Preserved
- Baseline, least-to-most, and token-fading procedures
- Token goals and model correction
- Levels 1–3
- Reinforcement media
- Reports and import/export

---


## v0.13.2 — Token Session Start Fix

### Fixed
- Prompt-fading token sessions could not begin because the comparison prompt function was missing
- Token sessions no longer report this startup failure as a grocery-data error
- Comparison prompt values now support all three shopping levels
- Improved browser compatibility for prompt-level labels

### Preserved
- Baseline and least-to-most procedures
- Token goals and model correction
- Student profiles and saved data
- Reinforcement media settings

---


## v0.13.1 — Startup and Session Hotfix

### Fixed
- Begin Shopping could fail after a student was created
- Core trial display functions were missing from v0.13
- Starter test profiles are restored when absent
- Token sessions now stop at the token goal or maximum-trial limit
- Completion media and session reports are restored

---


## v0.13 — Prompt Fading + Token Acquisition

### Added
- Prompt Fading + Token Goal teaching profile
- Five teacher-selected starting prompt levels
- Response-button lock until programmed prompt completion
- Correct-first-response token contingency
- Model correction after errors without token delivery
- Token goal and maximum-trial safeguard
- Student-facing token board
- Built-in brief token celebration
- Optional local token GIF/image
- Optional completed-board animation and audio
- Token and correction data in session records

### Preserved
- Baseline with no prompting or reinforcement
- Least-to-most fixed-trial teaching
- Shopping Levels 1–3
- Budget ranges, reports, and import/export

---


## v0.12.3 — Solvable Cart Trials

### Fixed
- Level 3 could generate a budget too small for any valid required-item combination
- Level 3 now guarantees at least one affordable cart solution
- The trial budget is raised only when needed to match the cheapest valid combination

### Preserved
- Student-specific budget settings
- Live Cart Total and Money Left
- Teaching correction flow
- Baseline first-submission measurement
- Prompting and reinforcement systems

---


## v0.12.2 — Live Cart Comparison Prompt

### Fixed
- Level 3 comparison band previously showed the first listed item price
- Level 3 now compares the live Cart Total with the student's Budget
- Comparison band updates immediately after each cart selection or removal

### Preserved
- Level 1 and Level 2 comparison prompts
- Level 3 audio prompting
- Baseline fidelity
- Cart selection and correction flow

---


## v0.12.1 — Cart Options Hotfix

### Fixed
- Level 3 now builds the grocery-choice set before rendering the cart.
- Grocery item options now appear on every Level 3 trial.
- Updated cache-busting version tags.

---

## v0.12 — Decision-Making Cart Build

### Added
- Level 3: Choose Items Within Budget
- Teacher-selected purchase target of 2–4 items
- Teacher-selected choice set of 4–5 items
- Tap-to-select cart choices
- Live Cart Total
- Live Money Left
- Check My Cart action
- Correction opportunity in teaching mode
- First-submission measurement in baseline
- Cart attempt count in trial records

### Preserved
- Level 1 single-item affordability
- Level 2 grocery-list affordability
- Baseline fidelity
- Prompting and reinforcement profiles
- Budget ranges
- Reports and import/export

---


## v0.10.2 — Navigation Hotfix

### Fixed
- Home-page navigation failure when a cached HTML file loaded with the newer script
- Level 2 comparison band now shows Total Cost instead of a single item price
- Added versioned CSS and JavaScript URLs to reduce browser caching issues

---


## v0.10.1 — Grocery List Affordability Build

### Added
- Shopping Level selector
- Level 1: single-item affordability
- Level 2: whole-list affordability
- Teacher-selected list size from 2–5 items
- Random grocery-list generation per trial
- Total-cost display
- Level-specific audio and comparison prompts

### Changed
- Removed the custom-list setup from the earlier v0.10 concept
- Preserved the simpler v0.9 teacher workflow

---


## v0.9 — Student Budget Range Build

### Added
- Fixed budget option per student
- Random minimum/maximum budget range per student
- Whole-dollar budget option
- 50-cent increment option
- Budget settings included in classroom backup files

### Preserved
- Baseline fidelity
- Reinforcement profiles
- Prompting hierarchy
- Session reports
- Import/export
- One-screen student layout

---


## v0.8 — Reinforcement Profile Build

### Added
- Student-specific reinforcement profiles
- Written praise option
- Written praise plus gentle chime option
- Student-specific praise text
- Student-specific reinforcement duration
- Universal session-completion animation
- `docs/VISION.md`
- `docs/CHANGELOG.md`

### Changed
- Baseline sessions now suppress all trial-by-trial reinforcement
- Baseline sessions now suppress error-correction feedback
- Teaching sessions continue to provide neutral feedback after incorrect responses
- Completion celebration is available in both Baseline and Teaching because it signals task completion rather than accuracy

### Preserved
- Student profiles
- Teacher platform
- Prompting hierarchy
- Latency collection
- Prompt-level reporting
- Import/export
- One-screen student layout

---

## v0.7.2 — Prompting Polish

### Added
- Simple instructional arrow inside the correct answer button

### Changed
- Correct answer enlarges and remains enlarged until the student responds
- Incorrect answer is slightly faded during the final prompt
- Unified price-and-budget comparison band remains visible through later prompts

### Fixed
- Navigation and student-loading regression from the earlier v0.7 build

---

## v0.6.x — Prompting System

### Added
- Initial spoken SD
- Visual price/budget comparison prompt
- Secondary spoken prompt
- Final modeled response cue
- Independent response tracking
- Prompt-level data
- Post-prompt latency
- Classroom backup import/export

---

## v0.5.x — Teacher Platform and Data

### Added
- Student manager
- Session reports
- Trial-by-trial latency
- Accuracy summaries
- CSV export
- One-screen student layout

---

## v0.4.x — Student Profiles and Continuous Trials

### Added
- Student profiles
- Student-specific trial counts
- Student-specific prompt settings
- Continuous trial flow
- Session welcome and completion screens
