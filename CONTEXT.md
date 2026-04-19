# Project Context: weR1 Tutors & Teachers

## What This Project Is
`weR1 Tutors & Teachers` is a public-facing tutor discovery website for students, parents, and families. It helps visitors:

- search for approved tuition teachers and coaching centers
- view a separate board of approved teaching requirements
- submit a tutor registration request
- submit a new teaching requirement for admin review

The product is intentionally search-first and privacy-conscious. Public visitors should not see the full tutor directory by default. They only see matching tutor records after they search or apply filters.

## Quick Mental Model
This project is a static frontend plus a lightweight Google Sheets and Apps Script backend.

- The website UI is built with plain `HTML`, `CSS`, and `JavaScript`
- Data lives in one Google Spreadsheet
- That spreadsheet has two tabs:
  - `Tutors`
  - `Requirements`
- Google Apps Script is used for reading and writing spreadsheet data
- Published Google Sheets CSV links are used as a fallback read source when Apps Script fails

End-to-end flow:

1. A page loads in the browser
2. `app.js` tries to fetch JSON from the Apps Script web app
3. If Apps Script read fails, `app.js` falls back to published CSV
4. Form submissions go through Apps Script into the correct sheet tab

## Public Pages

### `index.html`
This is the homepage and tutor search page.

It contains:

- the top statistics strip
- the search field
- the category filter
- the class filter
- tutor search results
- the tutor registration modal

### `requirements.html`
This is the dedicated requirements notice board.

It contains:

- the featured requirement section
- the open requirements list
- the closed requirements list
- the requirement submission modal

## Main Files

- `index.html`: homepage and tutor search UI
- `requirements.html`: public requirements board UI
- `styles.css`: shared styling and responsive layout rules
- `app.js`: frontend behavior, data fetching, filtering, rendering, and form submission
- `code.gs`: Apps Script backend for reading and writing spreadsheet data
- `appsscript.json`: Apps Script manifest used by `clasp`
- `.clasp.json`: binds this repo to the Apps Script project
- `.github/workflows/deploy.yml`: GitHub Actions workflow that pushes Apps Script files and redeploys the web app
- `requirements-sample.csv`: local sample file kept for reference/testing

## Product Behavior

### Tutor Search
The tutor directory is not shown openly on first load.

- The stats at the top are calculated from approved tutor rows
- Tutor cards only appear after the visitor searches or filters
- Search currently matches fields such as:
  - `Name`
  - `Subjects Taught`
  - `Area`
- Filters currently include:
  - category
  - class

### Requirements Board
The requirements page shows teaching requests, not tutors.

- `Approved` requirements appear in the open list
- `Closed` requirements appear in the closed list
- `Pending` requirements stay hidden from the public site
- Requirements are ordered newest first based on `Created At`

### Tutor Registration Form
Visitors can submit tutor details from the site.

- submissions go to the `Tutors` tab through Apps Script
- newly submitted tutors are stored with `Pending` status
- they do not appear publicly until manually changed to `Approved`

### Requirement Submission Form
Visitors can submit a teaching requirement from the requirements page.

- submissions go to the `Requirements` tab through Apps Script
- a requirement ID is generated for each new submission
- newly submitted requirements are stored with `Pending` status
- they only appear publicly after admin approval

## What The Public Can See

### Visible

- approved tutor results that match the current search or filters
- approved tutor-based statistics
- approved requirements
- closed requirements

### Hidden

- the full tutor list before search or filtering
- tutors with `Pending` status
- requirements with `Pending` status
- internal data-source diagnostics by default

## Data Model

### Spreadsheet Structure
There is one spreadsheet with two tabs.

Spreadsheet ID currently used by Apps Script:

`111BKs-mtJk-fEx_fXGTIqsuAeH7HcAOo6-9gzfTVARk`

### Tutors Tab
Expected tab name:

`Tutors`

Expected headers:

1. `Name`
2. `Category`
3. `Classes Taught`
4. `Subjects Taught`
5. `Area`
6. `Phone`
7. `Email`
8. `Status`

### Requirements Tab
Expected tab name:

`Requirements`

Expected headers:

1. `Requirement ID`
2. `Created At`
3. `Class`
4. `Subjects`
5. `Email`
6. `Location`
7. `No Location Constraint`
8. `Contact Number`
9. `Notes`
10. `Status`
11. `Closed At`

## How Reading Data Works
Frontend data fetching is handled in `app.js`.

### Primary Read Path
The frontend first tries the Apps Script web app:

- `?resource=tutors`
- `?resource=requirements`

Apps Script returns JSON arrays from the matching sheet tab.

### Fallback Read Path
If Apps Script fails, the frontend falls back to CSV links.

Important detail:

- one spreadsheet can contain both tabs
- but CSV fallback still needs one CSV export per tab
- a single generic CSV URL does not represent both tabs at once

Current frontend configuration in `app.js`:

- `GOOGLE_SHEET_CSV_URL`
  - tutors/default published CSV
- `REQUIREMENTS_SHEET_CSV_URL`
  - requirements-tab CSV using `gid=1772117371`
- `GOOGLE_APPS_SCRIPT_URL`
  - Apps Script web app URL used for reads and writes

## How Writing Data Works
All form submissions go through `code.gs`.

### Tutor Submission
When `formType === "tutor_registration"`:

- Apps Script writes to the `Tutors` sheet
- the row is saved with `Pending` status

### Requirement Submission
When `formType === "requirement_submission"`:

- Apps Script writes to the `Requirements` sheet
- a `Requirement ID` is generated
- the row is saved with `Pending` status

## Apps Script Architecture
`code.gs` is the backend router.

Key points:

- it no longer relies only on `getActiveSpreadsheet()`
- it now prefers the explicit `SPREADSHEET_ID`
- it can also read `SPREADSHEET_ID` from script properties if needed
- it uses named tabs:
  - `Tutors`
  - `Requirements`

This means the backend is correctly designed for one spreadsheet with multiple tabs.

## Deployment Setup

### Apps Script Deployment
Apps Script files are pushed using `clasp`.

Relevant files:

- `.clasp.json`
- `appsscript.json`
- `code.gs`

### GitHub Actions
The workflow in `.github/workflows/deploy.yml`:

1. checks out the repo
2. installs `clasp`
3. creates the credential file from the GitHub secret
4. validates required Apps Script files exist
5. reads `APPS_SCRIPT_DEPLOYMENT_ID` from a GitHub repository variable
6. runs `clasp push -f`
7. updates the existing Apps Script deployment using that deployment id
8. verifies the live `/exec?resource=requirements` endpoint returns valid JSON

### Single Source Of Truth
The Apps Script deployment id for CI/CD now lives in the GitHub repository variable:

- `APPS_SCRIPT_DEPLOYMENT_ID`

The frontend still has a default deployment id in `app.js`, but it can also be overridden at runtime through:

- `window.WER1_RUNTIME_CONFIG.googleAppsScriptDeploymentId`

This reduces drift between:

- the live frontend Apps Script URL
- the deployment id used by `clasp deploy`

## Recent Fixes And Lessons Learned

### Explicit Spreadsheet Binding
The backend originally depended on `SpreadsheetApp.getActiveSpreadsheet()`, which can fail for standalone Apps Script deployments.

Fix:

- added explicit spreadsheet opening by ID

### Manifest Placement
The Apps Script manifest was previously sitting under `.github/workflows/`, which is not where `clasp` normally expects it.

Fix:

- moved `appsscript.json` to the repo root

### Tutors CSV Fallback
The original tutors CSV URL stopped returning public CSV and instead redirected to a Google sign-in or cookie page.

Fix:

- switched tutors fallback to the working published CSV URL:
  - `https://docs.google.com/spreadsheets/d/e/2PACX-1vTUM0jeipzZXRCK7VnX_lLgX6KRNfNTsK7rtasptLh-uvn3q-TseYyCS_S_tvUhRshe0gR9QhLFHtFN/pub?output=csv`

### Hosting Delay
At one point, the site continued showing old behavior even after code changes were pushed. Later it started working without further edits.

Most likely reasons:

- deployment propagation delay
- hosting cache delay
- browser cache delay

This means not every "same error after deploy" situation is a code issue.

## Debugging Behavior
The frontend supports private diagnostics without exposing them to normal visitors by default.

### Normal Visitors See

- the normal UI
- generic load errors only

### Debug Mode
If the page URL includes:

`?debugData=1`

then the frontend shows small on-page debug badges and logs more data-source detail in the browser console.

This is intended for admin or debugging use only.

## Operational Notes
The site may appear healthy even if Apps Script is unhealthy, because CSV fallback can rescue read operations.

That means:

- tutor listing and stats can still work through CSV fallback
- form submissions still depend on Apps Script
- requirements read operations also depend on whether the requirements CSV export is public and correct

When diagnosing a production issue, always check:

1. Is the Apps Script web app publicly accessible?
2. Is the tutors CSV URL public?
3. Is the requirements CSV URL public?
4. Has the host picked up the latest frontend build?
5. Is the browser showing cached old JavaScript?

## End-To-End Summary
If someone completely new joins the project, this is the simplest way to think about it:

1. `index.html` and `requirements.html` render the public site
2. `app.js` drives all page behavior
3. data is stored in one spreadsheet with two tabs
4. `code.gs` is the read and write API layer for that spreadsheet
5. CSV URLs are backup read paths, not the main backend
6. only approved data is shown publicly
7. deployment happens through GitHub Actions and `clasp`

## Future Improvements

- make Apps Script health easier to verify from an admin-only endpoint
- separate public data health from form submission health in the UI
- add a lightweight admin runbook for publishing CSVs and validating deployment
- consider moving config values into a single documented setup section or an environment-managed flow
