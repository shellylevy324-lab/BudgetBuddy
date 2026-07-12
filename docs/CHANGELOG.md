# Budget Buddy Changelog

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
