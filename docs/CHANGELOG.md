# Budget Buddy Changelog

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
