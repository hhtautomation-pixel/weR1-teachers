# Project: weR1 Tutors & Teachers

## Overview
**weR1 Tutors** is a professional, high-performance tutor discovery website designed to connect students with tuition teachers and coaching centers.

The current product direction is **search-first and privacy-conscious**:
- Public visitors should **not** see the full teacher/coaching directory by default.
- Tutor and coaching data should remain confidential with the website owner unless a visitor performs a relevant search or applies a meaningful filter.
- Only matching approved results should be shown in the public UI.

The application follows a **Serverless Architecture**, using Google Sheets as a low-cost, flexible backend for both data reading and form submissions.

---

## Key Features
- **Search-Only Public Access**: The full educator list stays hidden on initial load. Visitors must search or filter before any listing is revealed.
- **Google Sheet Powered Stats**: The top section displays live aggregate counts for tuition teachers, coaching centers, locations, and subjects, calculated from approved Google Sheet rows.
- **Approval-Based Visibility**: New registrations submitted through the form stay hidden until the Admin marks them as `Approved` in the Google Sheet.
- **Search & Filter Matching**: Results are shown based on search text plus selected filters such as category and class.
- **Dedicated Requirements Notice Board**: Tutor requirements now live on a separate `Requirements` page, with open and closed notices shown in a premium board layout.
- **Requirement Submission Flow**: Visitors can post a requirement through a dedicated modal form, and the requirement appears publicly only after admin approval.
- **Premium Aesthetics**: Emerald green and gold academic styling with glassmorphism, responsive cards, and polished spacing.

---

## Current UX Direction
- The website now has **two clear public pages**:
  - `index.html` for tutor search
  - `requirements.html` for the requirements notice board
- The top navigation is framed around **Search** and **Requirements**, not a public directory.
- The statistics strip appears **above** the main hero heading.
- The homepage is intentionally **search-first**, not browse-first.
- The older lower-page category browsing strip and chip-based discovery controls have been removed from the active UI.
- The requirements notice board is intentionally **not** shown on the homepage anymore.
- The top `Post Requirement` action now routes users to the dedicated requirements page, where requirement notices and the posting modal live.

---

## Tech Stack
- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+).
- **Typography**: Google Fonts (`Outfit` and `Inter`) for a premium, academic feel.
- **Icons**: FontAwesome 6.
- **Data Management**:
  - **Primary Reading**: Google Apps Script web app (`doGet`) serving tutor and requirement rows as JSON directly from named sheet tabs.
  - **Fallback Reading**: Google Sheets published as CSV, parsed client-side using **PapaParse** when needed.
  - **Writing**: Google Apps Script (`doPost`) handling POST requests from tutor registration and requirement submission forms.
- **Deployment**: Hosted on GitHub/Netlify for fast, globally distributed access.

---

## File Structure
- `index.html`: Search-only homepage with stats, hero, tutor search form, search results, and tutor registration modal.
- `requirements.html`: Dedicated requirements page with the notice-board layout, open/closed requirement sections, and requirement submission modal.
- `styles.css`: Shared design system, search-page styling, requirements-page styling, responsive layouts, cards, and modal presentation.
- `app.js`: Shared client-side logic for tutor search, stats, requirement board fetching/rendering, and both tutor/requirement form submission handlers.
- `code.gs`: Google Apps Script router that handles multiple form types and writes to the correct sheet tab.
- `google_sheets_setup_guide.md`: Detailed instructions for the Admin to connect their own sheet.
- `requirements-sample.csv`: Local sample requirements data used for local preview/testing until the real requirements CSV is connected.

---

## Google Sheet Architecture
The app now expects **separate sheet tabs** for tutors and requirements.

### Tutors Tab
Suggested tab name: `Tutors`

Headers in **Row 1**:
1. `Name`
2. `Category` (`Tuition Teacher` or `Coaching Center`)
3. `Classes Taught` (e.g. `1 to 5`, `11 to 12`)
4. `Subjects Taught`
5. `Area`
6. `Phone`
7. `Email`
8. `Status` (`Approved` or `Pending`)

### Requirements Tab
Suggested tab name: `Requirements`

Headers in **Row 1**:
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

---

## Data Rules
- Only rows with `Status = Approved` should appear in public search results.
- Aggregate counts at the top of the page should also be calculated from approved rows only.
- Search matching currently checks relevant text fields such as name, subjects, and area.
- The website owner retains control over the complete dataset through the Google Sheet.
- Requirement notices use this visibility workflow:
  - `Pending` -> hidden from the public site
  - `Approved` -> visible in the open requirements section
  - `Closed` -> moved to the closed requirements section
- Requirement ordering is newest first based on `Created At`.
- If `No Location Constraint` is marked `Yes`, the public UI should display that instead of a specific location.

---

## Configuration
The project is configured via constants at the top of `app.js`:
- `GOOGLE_SHEET_CSV_URL`: Tutors CSV fallback link.
- `REQUIREMENTS_SHEET_CSV_URL`: Requirements CSV fallback/source. During local development this can point to `requirements-sample.csv`; in production it can point to the published Requirements-tab CSV.
- `GOOGLE_APPS_SCRIPT_URL`: The "Web App" deployment URL of the Apps Script.

In `code.gs`, the script also relies on:
- `TUTORS_SHEET_NAME`
- `REQUIREMENTS_SHEET_NAME`

Current integration expectation:
- The deployed Apps Script web app should support:
  - `?resource=tutors`
  - `?resource=requirements`
- The frontend uses these Apps Script read endpoints first and only falls back to CSV if needed.

---

## Future Roadmap
- [ ] **Rating & Feedback**: Allow students to leave reviews verified by Admin.
- [ ] **Direct WhatsApp Integration**: One-click messaging for immediate connectivity.
- [ ] **Multi-City Support**: Expand `Area` filtering into city-wide segmentation.
- [ ] **Profile Pages**: Dedicated URLs for individual teachers/centers.
- [ ] **Tutor-Requirement Matching**: Automatically identify tutors matching a newly approved requirement.
- [ ] **Email Outreach Automation**: Send requirement alerts to relevant tutors and log delivery status.
- [ ] **Revisit Discovery Controls**: Decide later whether any secondary browsing/navigation controls should return in some form.
