# Buddy Skills v2.1.0 Reporting Infrastructure

This update connects the Teacher Center Reports interface to shared Supabase reporting tables.

## Included

- `SUPABASE-v2.1.0-REPORTING.sql`
- `reports.js`
- updated `teacher-center.html`
- updated `teacher-center.js`
- complete `platform.css`
- installation instructions

## Reporting model

- `student_sessions`: one row per activity session
- `student_trials`: one row per completed trial
- `student_trial_export`: readable, RLS-protected export view

Reports support student, activity, date-range, and teaching-phase filters; session details; summary totals; and Excel-friendly CSV export.

The tables are intentionally shared across Buddy Skills modules. Budget Buddy will be connected to write session and trial rows in the next update.
