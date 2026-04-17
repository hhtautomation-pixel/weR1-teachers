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
- **Premium Aesthetics**: Emerald green and gold academic styling with glassmorphism, responsive cards, and polished spacing.

---

## Current UX Direction
- The top navigation is now framed around **Search**, not a public directory.
- The statistics strip appears **above** the main hero heading.
- The public experience is intentionally **search-first**, not browse-first.
- The older lower-page category browsing strip and chip-based discovery controls have been removed from the active UI for now.
- The search results section behaves like a normal results area rather than a browsable directory landing page.

---

## Tech Stack
- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+).
- **Typography**: Google Fonts (`Outfit` and `Inter`) for a premium, academic feel.
- **Icons**: FontAwesome 6.
- **Data Management**:
  - **Reading**: Google Sheets published as CSV, parsed client-side using **PapaParse**.
  - **Writing**: Google Apps Script (`doPost`) handling POST requests from the registration form.
- **Deployment**: Hosted on GitHub/Netlify for fast, globally distributed access.

---

## File Structure
- `index.html`: Core structure including the fixed header, hero section, live stats panel, search form, results section, and registration modal.
- `styles.css`: Custom design tokens, glassmorphic UI components, hero/stats layout, responsive styles, and card presentation.
- `app.js`: Application state management, Google Sheet CSV parsing, approved-row filtering, search/results rendering, stats calculation, and form submission handlers.
- `code.gs`: The Google Apps Script backend that lives within the Google Sheet to handle incoming form data.
- `google_sheets_setup_guide.md`: Detailed instructions for the Admin to connect their own sheet.

---

## Google Sheet Architecture
The application expects a Google Sheet with the following headers in **Row 1**:
1. `Name`
2. `Category` (`Tuition Teacher` or `Coaching Center`)
3. `Classes Taught` (e.g. `1 to 5`, `11 to 12`)
4. `Subjects Taught`
5. `Area`
6. `Contact`
7. `Status` (`Approved` or `Pending`)

If email and phone are being used in the UI or form pipeline, those fields should also remain aligned between the Google Sheet and Apps Script setup.

---

## Data Rules
- Only rows with `Status = Approved` should appear in public search results.
- Aggregate counts at the top of the page should also be calculated from approved rows only.
- Search matching currently checks relevant text fields such as name, subjects, and area.
- The website owner retains control over the complete dataset through the Google Sheet.

---

## Configuration
The project is configured via two constants at the top of `app.js`:
- `GOOGLE_SHEET_CSV_URL`: The "Publish to Web" CSV link of the Google Sheet.
- `GOOGLE_APPS_SCRIPT_URL`: The "Web App" deployment URL of the Apps Script.

---

## Future Roadmap
- [ ] **Rating & Feedback**: Allow students to leave reviews verified by Admin.
- [ ] **Direct WhatsApp Integration**: One-click messaging for immediate connectivity.
- [ ] **Multi-City Support**: Expand `Area` filtering into city-wide segmentation.
- [ ] **Profile Pages**: Dedicated URLs for individual teachers/centers.
- [ ] **Revisit Discovery Controls**: Decide later whether category tabs or chip-based secondary navigation should return in any form.
