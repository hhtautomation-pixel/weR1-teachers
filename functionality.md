# weR1 System Functionality Baseline

## Purpose

This document captures the functionality currently present in the `weR1` system as of the latest code review. It should be updated whenever a feature is added, removed, or materially changed.

## System Overview

The system is a lightweight tutor directory and requirement board built with:

- Static frontend pages: [index.html](<C:/Users/MIRAN AHMED/Desktop/infimode/weR1/index.html>), [requirements.html](<C:/Users/MIRAN AHMED/Desktop/infimode/weR1/requirements.html>)
- Shared client logic: [app.js](<C:/Users/MIRAN AHMED/Desktop/infimode/weR1/app.js>)
- Google Apps Script backend: [code.gs](<C:/Users/MIRAN AHMED/Desktop/infimode/weR1/code.gs>)
- Google Sheets used as the system of record for reads and writes

## Core Functionalities

### 1. Tutor Directory Search

Users can search the tutor directory from the home page.

Current behavior:

- Tutor data is fetched on page load.
- Data is requested from Google Apps Script first.
- If Apps Script read fails, the app falls back to published CSV data from Google Sheets.
- Directory results remain hidden until the user performs a search or applies at least one filter.
- Search matches against:
  - Tutor name
  - Subjects taught
  - Area
- Users can filter by:
  - Category
  - Class range
- Active filters are displayed as removable tags.
- Users can clear all active filters at once.

### 2. Tutor Directory Result Rendering

For each visible tutor listing, the system currently shows:

- Name, prefixed with title when available
- Category
- Area / location
- Subjects taught
- Classes taught
- Email
- Call action using the phone number

Business rules:

- Only tutors with status `Approved` are shown.
- If the `Status` field is missing, the tutor is treated as visible.

### 3. Tutor Summary Statistics

The homepage shows aggregate statistics calculated from approved tutor records:

- Total tuition teachers
- Total coaching centres
- Total unique locations
- Total unique subjects

### 4. Tutor Registration Submission

Users can open the "Join as Tutor" modal and submit a registration form.

Collected fields:

- Title (`Mr` or `Ms`)
- Full name
- Category
- Classes taught
- Subjects
- Highest qualification
- Area
- Phone number
- Email address

Submission flow:

- Frontend sends a `POST` request to the Google Apps Script web app.
- Frontend trims field values before submission.
- Backend writes the submission into the `Tutors` sheet.
- Tutor-sheet writes are matched by header name, not by column order.
- Backend validates required fields, title, category, email, and phone number before writing.
- Backend normalizes stored email and phone values.
- Backend protects sheet cells from formula-style input.
- New records are stored with status `Pending`.
- User sees a success state only after the backend confirms the write succeeded.

### 5. Requirements Board Read View

Users can open the requirements page and view teaching requirements.

Current behavior:

- Requirement data is fetched on page load.
- Data is requested from Google Apps Script first.
- If Apps Script read fails, the app falls back to the published Requirements CSV.
- Requirements are separated into:
  - Open requirements
  - Closed requirements
- The newest open requirement is featured first.
- If no open requirement exists, the newest closed one becomes the featured card.

Displayed requirement details:

- Derived title
- Status
- Created date
- Class
- Subjects
- Location or "No Location Constraint"
- Contact number
- Notes

Open requirements side panel behavior:

- The side-panel heading shows the live count, such as `5 Open Requirements`
- A `View All` action expands all open requirement cards in the side panel
- Open requirements are shown as compact summary cards by default
- Clicking a compact card expands it to show the full requirement details and call action

### 6. Requirement Submission

Users can post a new requirement from the requirements page or shared entry points.

Collected fields:

- Class
- Subjects
- Email address
- Contact number
- Location
- No location constraint flag
- Notes

Submission flow:

- Frontend sends a `POST` request to the Google Apps Script web app.
- Frontend trims field values before submission.
- Backend writes the submission into the `Requirements` sheet.
- Requirement-sheet writes are matched by header name, not by column order.
- Backend generates a requirement ID.
- Backend validates required fields, email, contact number, and conditional location requirements before writing.
- Backend protects sheet cells from formula-style input.
- Backend stores:
  - Requirement ID
  - Created timestamp
  - Submitted fields
  - Status as `Pending`
  - Empty closed timestamp
- User sees a success state only after the backend confirms the write succeeded.

### 7. Shared UX Behaviors

The system currently includes:

- Desktop navigation
- Mobile menu overlay
- Modal-based forms
- Loading states for tutor data and requirement data
- Empty and setup states for the requirements board
- Optional debug badges when `?debugData=1` is present in the URL

## Backend Capabilities

The Google Apps Script backend currently supports:

### GET resources

- `resource=tutors`
- `resource=requirements`
- default health-style response when no known resource is requested

### POST form types

- `formType=tutor_registration`
- `formType=requirement_submission`

## External Dependencies

The system currently depends on:

- Google Apps Script web app endpoint
- Google Sheets spreadsheet
- Published CSV URLs for fallback reads
- Papa Parse CDN
- Font Awesome CDN
- Google Fonts CDN

## Data Model Expectations

### Tutors sheet expected columns

- Title
- Name
- Category
- Classes Taught
- Subjects Taught
- Highest Qualification
- Area
- Phone
- Email
- Status

Note:

- The tutor write flow depends on these header names existing, but not on their physical order in the sheet.

### Requirements sheet expected columns

- Requirement ID
- Created At
- Class
- Subjects
- Email
- Location
- No Location Constraint
- Contact Number
- Notes
- Status
- Closed At

Note:

- The requirement write flow depends on these header names existing, but not on their physical order in the sheet.

## Known Functional Constraints

- The tutor directory is intentionally search-gated and does not display listings by default.
- New tutor registrations and requirements are not immediately public; they depend on admin approval.
- The public UI allows calling a contact number directly from listing cards.
- Read behavior has two paths: Apps Script primary and CSV fallback.
- Write behavior depends entirely on the Apps Script endpoint.

## Update Process For This Document

Update this file whenever any of the following change:

- New pages or user flows are added
- Form fields are added, removed, or renamed
- Filtering or search logic changes
- Approval rules change
- Data source strategy changes
- Backend endpoints or sheet schemas change
- Any user-visible result card content changes

When updating, record:

- What changed
- Which screens are affected
- Which data fields are affected
- Whether backward compatibility was preserved
