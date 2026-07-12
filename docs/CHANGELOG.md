# Budget Buddy Changelog

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
