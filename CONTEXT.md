# Project: weR1 Tutors & Teachers

## Overview
**weR1 Tutors** is a professional, high-performance web directory designed to connect students with tuition teachers and coaching centers. It features a modern "Discovery-first" UI with interactive tabs and chips, enabling seamless navigation through educational categories, classes, and subjects.

The application follows a **Serverless Architecture**, leveraging Google Sheets as a low-cost, high-flexibility database for both data reading and form submissions.

---

## 🚀 Key Features
-   **Interactive Discovery UI**: Tabbed navigation between categories (e.g., Tuition Teachers vs. Coaching Centres).
-   **Dynamic Filter Chips**: Category-specific class chips (e.g., "6 to 10") that update instantly based on available data.
-   **Global Search & Filter Sync**: A hero-section search box that stays in perfect sync with the directory's active tabs and chips.
-   **Admin Approval Loop**: A "Pending/Approved" status system. New registrations via the "Join as Tutor" modal are hidden until the Admin manually approves them in the Google Sheet.
-   **Premium Aesthetics**: An Emerald Green and Gold academic theme featuring glassmorphism, responsive masonry-style grids, and staggered animations.

---

## 🛠 Tech Stack
-   **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+).
-   **Typography**: Google Fonts (Outfit & Inter) for a premium, academic feel.
-   **Icons**: FontAwesome 6.
-   **Data Management**: 
    -   **Reading**: Google Sheets published as CSV, parsed client-side using **PapaParse**.
    -   **Writing**: Google Apps Script (`doPost`) handling POST requests from the registration form.
-   **Deployment**: Hosted on GitHub/Netlify for fast, globally distributed access.

---

## 📂 File Structure
-   `index.html`: The core structure, including the Hero Section, Discovery Tabs, and Registration Modal.
-   `styles.css`: Custom design tokens, glassmorphic UI components, and responsive layout logic.
-   `app.js`: Application state management, dynamic chip rendering, filtering logic, and form submission handlers.
-   `code.gs`: The Google Apps Script backend that lives within the Google Sheet to handle incoming form data.
-   `google_sheets_setup_guide.md`: Detailed instructions for the Admin to connect their own sheet.

---

## 📊 Google Sheet Architecture
The application expects a Google Sheet with the following headers in **Row 1**:
1.  `Name`
2.  `Category` (`Tuition Teacher` or `Coaching Center`)
3.  `Classes Taught` (e.g., `1 to 5`, `11 to 12`)
4.  `Subjects Taught`
5.  `Area`
6.  `Contact`
7.  `Status` (`Approved` or `Pending`)

---

## ⚙️ Configuration
The project is configured via two constants at the top of `app.js`:
-   `GOOGLE_SHEET_CSV_URL`: The "Publish to Web" CSV link of the Google Sheet.
-   `GOOGLE_APPS_SCRIPT_URL`: The "Web App" deployment URL of the Apps Script.

---

## 🛠 Future Roadmap
-   [ ] **Rating & Feedback**: Allow students to leave reviews verified by Admin.
-   [ ] **Direct WhatsApp Integration**: One-click messaging for immediate connectivity.
-   [ ] **Multi-City Support**: Expand "Area" filtering into city-wide segmentation.
-   [ ] **Profile Pages**: Dedicated URLs for individual teachers/centers.
