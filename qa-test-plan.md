# weR1 QA Test Plan

## Scope

This plan covers the current `weR1` tutor directory and requirements board.

## Test Types

### Smoke Testing

Run after every deployment:

- Homepage loads without console-blocking errors.
- Requirements page loads without console-blocking errors.
- Tutor search returns results for a known approved tutor.
- Tutor registration modal opens, closes, and submits.
- Requirement modal opens, closes, and submits.

### Regression Testing

Run after any UI, data, or backend change:

- Search remains hidden before the user enters criteria.
- Search by tutor name still works.
- Search by subject still works.
- Search by area still works.
- Category filter still works.
- Class filter still works.
- Filter tags can be removed individually.
- Clear all filters resets the page state.
- Approved tutors remain visible.
- Pending tutors remain hidden.
- Open requirements remain separated from closed requirements.
- The latest open requirement remains featured first.
- Requirement submission still stores pending status.
- Tutor registration still stores pending status.

### Black Box Testing

Validate behavior from the user perspective only:

- Searching with a valid keyword shows matching tutor cards.
- Searching with a non-matching keyword shows the empty state.
- Submitting valid tutor details shows the success state.
- Submitting valid requirement details shows the success state.
- Missing required form fields are blocked by browser validation.
- Invalid email format is blocked by browser validation.
- Invalid phone format is blocked by browser validation.
- Clicking a phone CTA creates a `tel:` action without breaking layout.

### Negative Testing

- Apps Script URL missing shows a submission error.
- Tutor data fetch failure shows a load error state.
- Requirements data fetch failure shows a load error state.
- Empty requirements source shows the setup or empty state correctly.
- Unexpected sheet payload does not break the full page render.

### Security Testing

- Stored HTML/JavaScript entered in tutor fields is rendered as text, not executed.
- Stored HTML/JavaScript entered in requirement fields is rendered as text, not executed.
- Phone and contact fields reject invalid schemes and malformed values.
- Direct POST requests with empty fields are rejected server-side.
- Large text input does not break rendering or sheet writes.
- Duplicate submissions from rapid repeated clicks do not create multiple rows.

### Accessibility Testing

- All controls are keyboard reachable.
- Modal can be opened and closed with keyboard-only interaction.
- Focus is visible on interactive controls.
- Form labels are associated with inputs.
- Mobile menu is usable by keyboard and screen reader.
- Color contrast meets WCAG AA for key text and buttons.

### Performance Testing

- Homepage remains responsive with large tutor datasets.
- Requirements page remains responsive with large requirement datasets.
- Repeated filtering does not visibly lag on target devices.

## Core Test Cases

### Tutor Search

1. Load homepage.
Expected: No tutor cards are visible and search prompt is shown.

2. Enter an approved tutor name and submit search.
Expected: Matching tutor card appears with correct details.

3. Search for a known pending tutor.
Expected: Tutor is not shown.

4. Select category only.
Expected: Only tutors from that category appear.

5. Select class only.
Expected: Only tutors matching that class range appear.

6. Combine search term, category, and class.
Expected: Only records matching all criteria appear.

7. Click a filter tag remove icon.
Expected: Only that filter is removed and results refresh.

8. Click clear all filters.
Expected: Search input clears, filters reset, and private search prompt returns.

### Tutor Registration

1. Open tutor registration modal.
Expected: Modal opens and background scroll is locked.

2. Submit valid data.
Expected: Success state appears and record is written as pending.

3. Submit with invalid email.
Expected: Browser blocks submission.

4. Submit with invalid phone length.
Expected: Browser blocks submission.

5. Simulate backend failure.
Expected: User sees failure alert and button state resets.

### Requirements Board

1. Load requirements page with approved and closed data available.
Expected: Featured card, open list, and closed list render correctly.

2. Load requirements page with no approved or closed records.
Expected: Empty state is shown.

3. Verify newest open requirement is featured.
Expected: Featured card matches latest open record by timestamp.

4. Verify closed records appear only in the closed section.
Expected: Closed records do not appear in the open list.

### Requirement Submission

1. Open requirement modal from each trigger.
Expected: Same modal opens from all entry points.

2. Submit valid requirement data.
Expected: Success state appears and row is written as pending.

3. Submit with no location constraint checked.
Expected: Stored record shows the no-location flag.

4. Simulate backend failure.
Expected: User sees failure alert and button state resets.

## Recommended Automation Priority

Automate first:

- Tutor search/filter logic
- Approved vs pending visibility logic
- Requirements status partitioning
- Submission success and failure handling
- Output escaping for user-provided content

## Exit Criteria

Before production release:

- All smoke tests pass
- All high-severity regression cases pass
- No stored XSS or input-validation security defects remain open
- Submission failure handling is verified against real backend responses
