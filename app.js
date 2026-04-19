// --- CONFIGURATION ---
// 1. For Reading Data: The CSV URL of your published Google Sheet
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUM0jeipzZXRCK7VnX_lLgX6KRNfNTsK7rtasptLh-uvn3q-TseYyCS_S_tvUhRshe0gR9QhLFHtFN/pub?output=csv";

// 1b. For Reading Requirement Notices: replace this local sample with the published Requirements-tab CSV URL
const REQUIREMENTS_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUM0jeipzZXRCK7VnX_lLgX6KRNfNTsK7rtasptLh-uvn3q-TseYyCS_S_tvUhRshe0gR9QhLFHtFN/pub?gid=1772117371&single=true&output=csv";

// 2. For Reading/Writing Data: the Apps Script deployment id and derived Web App URL.
// The frontend can optionally be overridden at runtime through window.WER1_RUNTIME_CONFIG.
const DEFAULT_GOOGLE_APPS_SCRIPT_DEPLOYMENT_ID = "AKfycbx8uNCOMiRgnYNaUSHGUJkUA3mZODDEh_MM7sW-dy33QGjsdCIQg7hLlEnvWbGPxnj9";
const GOOGLE_APPS_SCRIPT_DEPLOYMENT_ID = (
    window.WER1_RUNTIME_CONFIG &&
    window.WER1_RUNTIME_CONFIG.googleAppsScriptDeploymentId
) || DEFAULT_GOOGLE_APPS_SCRIPT_DEPLOYMENT_ID;
const GOOGLE_APPS_SCRIPT_URL = `https://script.google.com/macros/s/${GOOGLE_APPS_SCRIPT_DEPLOYMENT_ID}/exec`;

// --- DUMMY DATA REMOVED ---
// Data is now fetched live from the Google Sheet above.

// Globals
let tutorsData = [];
let requirementsData = [];
let activeTabCategory = '';
let activeClassChip = 'All';
let hasCommittedSearch = false;
const DATA_DEBUG_ENABLED = new URLSearchParams(window.location.search).get('debugData') === '1';
let tutorsDataSource = '';
let requirementsDataSource = '';

// DOM Elements
const tutorsGrid = document.getElementById('tutorsGrid');
const loader = document.getElementById('loader');
const noResults = document.getElementById('noResults');
const searchPrompt = document.getElementById('searchPrompt');
const resultsCount = document.getElementById('resultsCount');
const activeFiltersContainer = document.getElementById('activeFiltersContainer');
const teachersCount = document.getElementById('teachersCount');
const centersCount = document.getElementById('centersCount');
const locationsCount = document.getElementById('locationsCount');
const subjectsCount = document.getElementById('subjectsCount');
const requirementsLoader = document.getElementById('requirementsLoader');
const requirementsContent = document.getElementById('requirementsContent');
const requirementsEmpty = document.getElementById('requirementsEmpty');
const requirementsSetup = document.getElementById('requirementsSetup');
const featuredRequirementCard = document.getElementById('featuredRequirementCard');
const openRequirementsList = document.getElementById('openRequirementsList');
const closedRequirementsList = document.getElementById('closedRequirementsList');
const openRequirementsHeading = document.getElementById('openRequirementsHeading');
const openRequirementsViewAll = document.getElementById('openRequirementsViewAll');
const openRequirementsCount = document.getElementById('openRequirementsCount');
const closedRequirementsCount = document.getElementById('closedRequirementsCount');
const postRequirementTriggers = document.querySelectorAll('#postRequirementBtn, #mobilePostRequirementBtn, #postRequirementInlineBtn, #postRequirementInlineBtnSecondary');

// Inputs
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const classFilter = document.getElementById('classFilter');
const searchBtn = document.getElementById('searchBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

const submitSpinner = document.getElementById('submitSpinner');
const joinBtn = document.getElementById('joinBtn');
const joinModal = document.getElementById('joinModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const successCloseBtn = document.getElementById('successCloseBtn');
const tutorForm = document.getElementById('tutorForm');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const modalFormContent = document.getElementById('modalFormContent');
const modalSuccessContent = document.getElementById('modalSuccessContent');
const requirementSubmitSpinner = document.getElementById('requirementSubmitSpinner');

// Mobile Nav Elements
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenuClose = document.getElementById('mobileMenuClose');
const mobileJoinBtn = document.getElementById('mobileJoinBtn');
const postRequirementBtn = document.getElementById('postRequirementBtn');
const mobilePostRequirementBtn = document.getElementById('mobilePostRequirementBtn');
const postRequirementInlineBtn = document.getElementById('postRequirementInlineBtn');
const requirementModal = document.getElementById('requirementModal');
const requirementForm = document.getElementById('requirementForm');
const requirementFormContent = document.getElementById('requirementFormContent');
const requirementSuccessContent = document.getElementById('requirementSuccessContent');
const closeRequirementModalBtn = document.getElementById('closeRequirementModalBtn');
const requirementSuccessCloseBtn = document.getElementById('requirementSuccessCloseBtn');
const requirementSubmitBtn = document.getElementById('requirementSubmitBtn');
const requirementSubmitText = document.getElementById('requirementSubmitText');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (tutorsGrid && loader && resultsCount) {
        fetchData();
    }

    if (requirementsLoader && featuredRequirementCard) {
        fetchRequirementsData();
    }

    setupEventListeners();
});

function fetchData() {
    showLoader();

    fetchSheetResource({
        resource: 'tutors',
        csvUrl: GOOGLE_SHEET_CSV_URL,
        onSuccess: ({ data, source }) => processData(data, source),
        onError: (error) => {
            resultsCount.textContent = DATA_DEBUG_ENABLED
                ? `Error loading tutor data: ${formatDataError(error)}`
                : "Error loading data. Please check your sheet connection.";
            hideLoader();
        }
    });
}

function fetchRequirementsData() {
    showRequirementsLoader();

    fetchSheetResource({
        resource: 'requirements',
        csvUrl: REQUIREMENTS_SHEET_CSV_URL,
        onSuccess: ({ data, source }) => {
            requirementsData = data;
            requirementsDataSource = source;
            renderRequirements();
        },
        onError: (error) => {
            if (!REQUIREMENTS_SHEET_CSV_URL || REQUIREMENTS_SHEET_CSV_URL.trim() === "") {
                showRequirementsSetup();
                return;
            }

            const errorMessage = DATA_DEBUG_ENABLED
                ? `Could not load the requirements board right now. ${formatDataError(error)}`
                : "Could not load the requirements board right now.";
            showRequirementsEmpty(errorMessage);
        }
    });
}

function fetchSheetResource({ resource, csvUrl, onSuccess, onError }) {
    fetchFromAppsScript(resource)
        .then((data) => {
            reportDataSource(resource, 'Apps Script');
            onSuccess({ data, source: 'Apps Script' });
        })
        .catch((appsScriptError) => {
            console.warn(`Apps Script ${resource} fetch failed, trying CSV fallback.`, appsScriptError);

            if (!csvUrl || csvUrl.trim() === "") {
                reportDataFailure(resource, {
                    appsScriptError: formatDataError(appsScriptError),
                    csvError: 'Missing CSV URL.'
                });
                onError(appsScriptError);
                return;
            }

            Papa.parse(csvUrl, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    if (results.errors && results.errors.length > 0) {
                        console.error(`CSV fallback parse warnings for ${resource}:`, results.errors);
                    }

                    reportDataSource(resource, 'CSV fallback');
                    onSuccess({ data: results.data, source: 'CSV fallback' });
                },
                error: function (csvError) {
                    console.error(`CSV fallback failed for ${resource}:`, csvError);
                    reportDataFailure(resource, {
                        appsScriptError: formatDataError(appsScriptError),
                        csvError: formatDataError(csvError)
                    });
                    onError(csvError || appsScriptError);
                }
            });
        });
}

function fetchFromAppsScript(resource) {
    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.trim() === "") {
        return Promise.reject(new Error("Apps Script URL missing."));
    }

    const separator = GOOGLE_APPS_SCRIPT_URL.includes('?') ? '&' : '?';
    const endpoint = `${GOOGLE_APPS_SCRIPT_URL}${separator}resource=${encodeURIComponent(resource)}`;

    return fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Apps Script returned ${response.status}`);
            }

            return response.json();
        })
        .then(data => {
            if (data && typeof data === 'object' && !Array.isArray(data) && data.ok === false) {
                throw new Error(data.error || "Apps Script returned an error.");
            }

            if (!Array.isArray(data)) {
                throw new Error("Apps Script returned an unexpected payload.");
            }

            return data;
        });
}

function processData(data, source) {
    tutorsData = data;
    tutorsDataSource = source;
    hideLoader();
    updateStats();
    applyFilters();
}

function renderTutors(dataToRender) {
    tutorsGrid.innerHTML = '';
    searchPrompt.classList.add('hidden');

    resultsCount.textContent = `Showing ${dataToRender.length} Tutors`;

    if (dataToRender.length === 0) {
        tutorsGrid.classList.add('hidden');
        noResults.classList.remove('hidden');
        return;
    }

    tutorsGrid.classList.remove('hidden');
    noResults.classList.add('hidden');

    dataToRender.forEach((tutor, index) => {
        // Create initials for avatar fallback
        const tutorTitle = safeDisplayText(tutor['Title'], '');
        const tutorName = safeDisplayText(tutor['Name'], 'Unnamed Tutor');
        const displayName = [tutorTitle, tutorName].filter(Boolean).join(' ');
        const initials = tutorName.substring(0, 2).toUpperCase();

        // Ensure values strictly exist
        const type = safeDisplayText(tutor['Category'], 'Educator');
        const classes = safeDisplayText(tutor['Classes Taught'], 'N/A');
        const subjects = safeDisplayText(tutor['Subjects Taught'], 'N/A');
        const area = safeDisplayText(tutor['Area'], 'Kolkata');
        const email = safeDisplayText(tutor['Email'], 'N/A');
        const phone = safeDisplayText(tutor['Phone'], 'Tutor');
        const safePhoneHref = buildTelHref(tutor['Phone']);

        // Add staggered animation delay
        const delay = (index % 10) * 0.1;

        const cardHTML = `
            <div class="tutor-card fade-up" style="animation-delay: ${delay}s">
                <div class="card-header">
                    <div class="avatar-placeholder">${initials}</div>
                    <span class="tutor-type">${escapeHtml(type)}</span>
                </div>
                
                <div class="tutor-info">
                    <h3>${escapeHtml(displayName)}</h3>
                    <div class="tutor-location">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${escapeHtml(area)}</span>
                    </div>
                </div>
                
                <div class="tutor-details">
                    <div class="detail-row">
                        <i class="fa-solid fa-book-open detail-icon"></i>
                        <div class="detail-content">
                            <span class="detail-label">SUBJECTS</span>
                            <span>${escapeHtml(subjects)}</span>
                        </div>
                    </div>
                    
                    <div class="detail-row">
                        <i class="fa-solid fa-chalkboard-user detail-icon"></i>
                        <div class="detail-content">
                            <span class="detail-label">CLASSES</span>
                            <span>${escapeHtml(classes)}</span>
                        </div>
                    </div>

                    <div class="detail-row">
                        <i class="fa-solid fa-envelope detail-icon"></i>
                        <div class="detail-content">
                            <span class="detail-label">EMAIL</span>
                            <span>${escapeHtml(email)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <a href="${safePhoneHref}" class="action-btn connect-btn"><i class="fa-solid fa-phone-volume" style="margin-right: 6px;"></i> Call ${escapeHtml(phone)}</a>
                </div>
            </div>
        `;
        tutorsGrid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function updateStats() {
    if (!teachersCount || !centersCount || !locationsCount || !subjectsCount) {
        return;
    }

    const approvedTutors = getApprovedTutors();
    const teacherTotal = approvedTutors.filter(tutor => tutor['Category'] === 'Tuition Teacher').length;
    const centerTotal = approvedTutors.filter(tutor => tutor['Category'] === 'Coaching Center').length;
    const uniqueLocations = new Set();
    const uniqueSubjects = new Set();

    approvedTutors.forEach(tutor => {
        splitMultiValueField(tutor['Area']).forEach(location => uniqueLocations.add(location));
        splitMultiValueField(tutor['Subjects Taught']).forEach(subject => uniqueSubjects.add(subject));
    });

    teachersCount.textContent = teacherTotal;
    centersCount.textContent = centerTotal;
    locationsCount.textContent = uniqueLocations.size;
    subjectsCount.textContent = uniqueSubjects.size;
}

function renderRequirements() {
    if (!featuredRequirementCard || !openRequirementsList || !closedRequirementsList) {
        return;
    }

    const openRequirements = getRequirementsByStatus(["approved", "open"]);
    const closedRequirements = getRequirementsByStatus(["closed"]);

    openRequirements.sort((a, b) => parseRequirementDate(b) - parseRequirementDate(a));
    closedRequirements.sort((a, b) => parseRequirementDate(b) - parseRequirementDate(a));

    hideRequirementsFeedbackStates();

    if (openRequirements.length === 0 && closedRequirements.length === 0) {
        showRequirementsEmpty("No approved or closed requirements are available yet.");
        return;
    }

    const featuredRequirement = openRequirements[0] || closedRequirements[0];
    featuredRequirementCard.innerHTML = buildFeaturedRequirementMarkup(featuredRequirement);

    openRequirementsList.innerHTML = openRequirements.length
        ? openRequirements.map((requirement, index) => buildOpenRequirementAccordionMarkup(requirement, index)).join("")
        : `<div class="requirement-card"><h4>No Open Requirements</h4><p class="requirement-summary">Approved teaching requirements will appear here as soon as they are available.</p></div>`;

    closedRequirementsList.innerHTML = closedRequirements.length
        ? closedRequirements.map(requirement => buildRequirementCardMarkup(requirement, true)).join("")
        : `<div class="requirement-card closed-card"><h4>No Closed Requirements Yet</h4><p class="requirement-summary">Closed notices will appear here once the admin marks a requirement as closed.</p></div>`;

    if (openRequirementsHeading) {
        openRequirementsHeading.textContent = `${openRequirements.length} Open Requirement${openRequirements.length === 1 ? '' : 's'}`;
    }

    if (openRequirementsViewAll) {
        openRequirementsViewAll.classList.toggle('hidden', openRequirements.length === 0);
    }

    if (openRequirementsCount) {
        openRequirementsCount.textContent = `${openRequirements.length} Open`;
    }

    closedRequirementsCount.textContent = `${closedRequirements.length} Closed`;
    requirementsContent.classList.remove('hidden');
    requirementsLoader.classList.add('hidden');
}

function getRequirementsByStatus(validStatuses) {
    return requirementsData.filter(requirement => {
        const status = (requirement['Status'] || '').toLowerCase().trim();
        return validStatuses.includes(status);
    });
}

function parseRequirementDate(requirement) {
    const createdAt = requirement['Created At'] || requirement['CreatedAt'] || requirement['Timestamp'] || '';
    const parsed = new Date(createdAt);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function buildFeaturedRequirementMarkup(requirement) {
    if (!requirement) {
        return `
            <div class="featured-meta">
                <span class="meta-pill">No Featured Notice</span>
            </div>
            <h3>The latest approved requirement will appear here.</h3>
            <p class="featured-summary">As soon as the admin approves a submitted requirement, it will be highlighted in this area.</p>
        `;
    }

    const status = getRequirementStatus(requirement);

    return `
        <div class="featured-meta">
            <span class="meta-pill ${status === 'Closed' ? 'status-closed' : 'status-open'}">${status}</span>
            <span class="meta-pill"><i class="fa-regular fa-clock"></i>${formatRequirementDate(requirement)}</span>
        </div>
        <h3>${buildRequirementTitle(requirement)}</h3>
        <p class="featured-summary">${escapeHtml(requirement['Notes'] || 'A newly submitted requirement approved by the admin and ready for tutor responses.')}</p>
        <div class="featured-details">
            ${buildRequirementDetailsMarkup(requirement)}
        </div>
        <div class="featured-actions">
            <a href="${buildTelHref(requirement['Contact Number'] || requirement['Contact'])}" class="action-btn connect-btn">
                <i class="fa-solid fa-phone-volume" style="margin-right: 6px;"></i> Call ${escapeHtml(safeDisplayText(requirement['Contact Number'] || requirement['Contact'], 'Now'))}
            </a>
        </div>
    `;
}

function buildRequirementCardMarkup(requirement, isClosed) {
    const status = getRequirementStatus(requirement);

    return `
        <article class="requirement-card ${isClosed ? 'closed-card' : ''}">
            <div class="requirement-meta">
                <span class="meta-pill ${status === 'Closed' ? 'status-closed' : 'status-open'}">${status}</span>
                <span class="meta-pill"><i class="fa-regular fa-clock"></i>${formatRequirementDate(requirement)}</span>
            </div>
            <h4>${buildRequirementTitle(requirement)}</h4>
            <p class="requirement-summary">${escapeHtml(requirement['Notes'] || 'No additional note provided.')}</p>
            <div class="requirement-details">
                ${buildRequirementDetailsMarkup(requirement)}
            </div>
            <div class="requirement-actions">
                <a href="${buildTelHref(requirement['Contact Number'] || requirement['Contact'])}" class="action-btn connect-btn">
                    <i class="fa-solid fa-phone-volume" style="margin-right: 6px;"></i> Call
                </a>
            </div>
        </article>
    `;
}

function buildOpenRequirementAccordionMarkup(requirement, index) {
    const title = buildRequirementTitle(requirement);
    const status = getRequirementStatus(requirement);
    const requirementClass = safeDisplayText(requirement['Class'], 'Class not specified');
    const subjects = safeDisplayText(requirement['Subjects'], 'Subjects not specified');
    const location = safeDisplayText(getRequirementLocation(requirement), 'Location not specified');
    const notes = safeDisplayText(requirement['Notes'], 'No additional note provided.');

    return `
        <article class="open-requirement-card" data-open-requirement-card="${index}">
            <button type="button" class="open-requirement-toggle" data-open-requirement-toggle="${index}" aria-expanded="false">
                <div class="open-requirement-topline">
                    <span class="meta-pill ${status === 'Closed' ? 'status-closed' : 'status-open'}">${status}</span>
                    <span class="meta-pill"><i class="fa-regular fa-clock"></i>${formatRequirementDate(requirement)}</span>
                </div>
                <h4>${title}</h4>
                <div class="open-requirement-summary-grid">
                    <span><strong>Class</strong>${escapeHtml(requirementClass)}</span>
                    <span><strong>Subjects</strong>${escapeHtml(subjects)}</span>
                    <span><strong>Location</strong>${escapeHtml(location)}</span>
                </div>
                <span class="open-requirement-expand-label">View Details <i class="fa-solid fa-chevron-down"></i></span>
            </button>
            <div class="open-requirement-details" data-open-requirement-details="${index}">
                <p class="requirement-summary">${escapeHtml(notes)}</p>
                <div class="requirement-details">
                    ${buildRequirementDetailsMarkup(requirement)}
                </div>
                <div class="requirement-actions">
                    <a href="${buildTelHref(requirement['Contact Number'] || requirement['Contact'])}" class="action-btn connect-btn">
                        <i class="fa-solid fa-phone-volume" style="margin-right: 6px;"></i> Call
                    </a>
                </div>
            </div>
        </article>
    `;
}

function buildRequirementDetailsMarkup(requirement) {
    const requirementClass = requirement['Class'] || 'Not specified';
    const subjects = requirement['Subjects'] || 'Not specified';
    const location = getRequirementLocation(requirement);
    const contact = requirement['Contact Number'] || requirement['Contact'] || 'Not specified';

    return `
        <div class="requirement-detail">
            <i class="fa-solid fa-graduation-cap"></i>
            <div><strong>CLASS</strong><span>${escapeHtml(requirementClass)}</span></div>
        </div>
        <div class="requirement-detail">
            <i class="fa-solid fa-book-open"></i>
            <div><strong>SUBJECTS</strong><span>${escapeHtml(subjects)}</span></div>
        </div>
        <div class="requirement-detail">
            <i class="fa-solid fa-location-dot"></i>
            <div><strong>LOCATION</strong><span>${escapeHtml(location)}</span></div>
        </div>
        <div class="requirement-detail">
            <i class="fa-solid fa-phone"></i>
            <div><strong>CONTACT</strong><span>${escapeHtml(contact)}</span></div>
        </div>
    `;
}

function buildRequirementTitle(requirement) {
    const requirementClass = requirement['Class'] || 'Class Not Mentioned';
    const subjects = requirement['Subjects'] || 'Subject Not Mentioned';
    const location = getRequirementLocation(requirement);
    return `Teacher Required - ${escapeHtml(requirementClass)} - ${escapeHtml(subjects)} - ${escapeHtml(location)}`;
}

function getRequirementLocation(requirement) {
    const noLocationConstraint = String(requirement['No Location Constraint'] || requirement['NoLocationConstraint'] || '')
        .toLowerCase()
        .trim();

    if (noLocationConstraint === 'yes' || noLocationConstraint === 'true') {
        return 'No Location Constraint';
    }

    return requirement['Location'] || 'Location Not Mentioned';
}

function formatRequirementDate(requirement) {
    const timestamp = parseRequirementDate(requirement);
    if (!timestamp) {
        return 'Recently added';
    }

    return new Date(timestamp).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function getRequirementStatus(requirement) {
    const status = (requirement['Status'] || '').toLowerCase().trim();
    return status === 'closed' ? 'Closed' : 'Open';
}

function showRequirementsLoader() {
    if (!requirementsLoader || !requirementsContent || !requirementsEmpty || !requirementsSetup) {
        return;
    }

    requirementsLoader.classList.remove('hidden');
    requirementsContent.classList.add('hidden');
    requirementsEmpty.classList.add('hidden');
    requirementsSetup.classList.add('hidden');
}

function showRequirementsEmpty(message) {
    if (!requirementsLoader || !requirementsContent || !requirementsEmpty || !requirementsSetup) {
        return;
    }

    requirementsLoader.classList.add('hidden');
    requirementsContent.classList.add('hidden');
    requirementsSetup.classList.add('hidden');
    requirementsEmpty.classList.remove('hidden');

    const emptyParagraph = requirementsEmpty.querySelector('p');
    if (emptyParagraph && message) {
        emptyParagraph.textContent = message;
    }
}

function showRequirementsSetup() {
    if (!requirementsLoader || !requirementsContent || !requirementsEmpty || !requirementsSetup) {
        return;
    }

    requirementsLoader.classList.add('hidden');
    requirementsContent.classList.add('hidden');
    requirementsEmpty.classList.add('hidden');
    requirementsSetup.classList.remove('hidden');
}

function hideRequirementsFeedbackStates() {
    if (!requirementsLoader || !requirementsEmpty || !requirementsSetup) {
        return;
    }

    requirementsLoader.classList.add('hidden');
    requirementsEmpty.classList.add('hidden');
    requirementsSetup.classList.add('hidden');
}

function setupEventListeners() {
    if (categoryFilter && classFilter && searchBtn && searchInput && clearFiltersBtn && activeFiltersContainer) {
        categoryFilter.addEventListener('change', () => {
            activeTabCategory = categoryFilter.value;
            hasCommittedSearch = hasActiveCriteria();
            applyFilters();
        });

        classFilter.addEventListener('change', () => {
            activeClassChip = classFilter.value || 'All';
            hasCommittedSearch = hasActiveCriteria();
            applyFilters();
        });

        searchBtn.addEventListener('click', () => {
            hasCommittedSearch = true;
            applyFilters();
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                hasCommittedSearch = true;
                applyFilters();
            }
        });

        clearFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            categoryFilter.value = '';
            classFilter.value = '';
            activeTabCategory = '';
            activeClassChip = 'All';
            hasCommittedSearch = false;
            applyFilters();
        });

        activeFiltersContainer.addEventListener('click', (e) => {
            const tag = e.target.closest('.filter-tag');
            if (!tag) return;

            const type = tag.getAttribute('data-type');
            if (type === 'search') {
                searchInput.value = '';
            }
            if (type === 'category') {
                categoryFilter.value = '';
                activeTabCategory = '';
            }
            if (type === 'class') {
                classFilter.value = '';
                activeClassChip = 'All';
            }

            hasCommittedSearch = hasActiveCriteria();
            applyFilters();
        });
    }

    // MOBILE MENU LOGIC
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
        });
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    }

    // Handle clicks on mobile nav links to close menu
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-item');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });

    postRequirementTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            if (!requirementModal) {
                return;
            }

            e.preventDefault();

            if (mobileMenu) {
                mobileMenu.classList.remove('active');
            }

            openRequirementModal();
        });
    });

    if (openRequirementsList) {
        openRequirementsList.addEventListener('click', (e) => {
            const toggle = e.target.closest('.open-requirement-toggle');
            if (!toggle) {
                return;
            }

            const targetId = toggle.getAttribute('data-open-requirement-toggle');
            toggleOpenRequirementCard(targetId, true);
        });
    }

    if (openRequirementsViewAll) {
        openRequirementsViewAll.addEventListener('click', () => {
            const cards = openRequirementsList ? openRequirementsList.querySelectorAll('.open-requirement-card') : [];
            cards.forEach(card => card.classList.add('expanded'));

            const toggles = openRequirementsList ? openRequirementsList.querySelectorAll('.open-requirement-toggle') : [];
            toggles.forEach(toggle => toggle.setAttribute('aria-expanded', 'true'));

            if (openRequirementsList && typeof openRequirementsList.scrollIntoView === 'function') {
                openRequirementsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
}

function toggleOpenRequirementCard(targetId, shouldScroll) {
    if (!openRequirementsList) {
        return;
    }

    const cards = openRequirementsList.querySelectorAll('.open-requirement-card');
    cards.forEach(card => {
        const isTarget = card.getAttribute('data-open-requirement-card') === targetId;
        const nextExpandedState = isTarget ? !card.classList.contains('expanded') : false;
        card.classList.toggle('expanded', nextExpandedState);

        const toggle = card.querySelector('.open-requirement-toggle');
        if (toggle) {
            toggle.setAttribute('aria-expanded', nextExpandedState ? 'true' : 'false');
        }

        if (isTarget && nextExpandedState && shouldScroll && typeof card.scrollIntoView === 'function') {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

function applyFilters() {
    if (!searchInput || !activeFiltersContainer || !resultsCount || !tutorsGrid || !noResults || !searchPrompt) {
        return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();

    // Use the global state which is now synced with both Tabs and Dropdowns
    const catValue = activeTabCategory;
    const classValue = (activeClassChip === 'All' || activeClassChip === '') ? '' : activeClassChip;

    updateActiveFiltersTags(searchTerm, catValue, classValue);

    if (!hasCommittedSearch) {
        renderPrivateState();
        return;
    }

    const filteredData = getApprovedTutors().filter(tutor => {
        // Search across multiple fields
        const matchesSearch = searchTerm === '' ||
            (tutor['Name'] && tutor['Name'].toLowerCase().includes(searchTerm)) ||
            (tutor['Subjects Taught'] && tutor['Subjects Taught'].toLowerCase().includes(searchTerm)) ||
            (tutor['Area'] && tutor['Area'].toLowerCase().includes(searchTerm));

        // Exact match for category
        const matchesCategory = catValue === '' || tutor['Category'] === catValue;

        // Exact or partial match for class
        const matchesClass = classValue === '' || (tutor['Classes Taught'] && tutor['Classes Taught'].includes(classValue));

        return matchesSearch && matchesCategory && matchesClass;
    });

    renderTutors(filteredData);
}

function getApprovedTutors() {
    return tutorsData.filter(tutor => {
        if (!tutor['Status']) {
            return true;
        }

        return tutor['Status'].toLowerCase().trim() === 'approved';
    });
}

function hasActiveCriteria() {
    const hasSearchTerm = searchInput.value.trim() !== '';
    const hasCategory = activeTabCategory !== '';
    const hasClass = activeClassChip !== '' && activeClassChip !== 'All';
    return hasSearchTerm || hasCategory || hasClass;
}

function renderPrivateState() {
    if (!tutorsGrid || !noResults || !searchPrompt || !resultsCount) {
        return;
    }

    tutorsGrid.innerHTML = '';
    tutorsGrid.classList.add('hidden');
    noResults.classList.add('hidden');
    searchPrompt.classList.remove('hidden');
    resultsCount.textContent = 'Search to view matching educators';
}

function formatDataError(error) {
    if (!error) {
        return 'Unknown error.';
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error.message) {
        return error.message;
    }

    if (error.status) {
        return `Request failed with status ${error.status}.`;
    }

    return 'Unknown error.';
}

function safeDisplayText(value, fallback = '') {
    if (value === null || value === undefined) {
        return fallback;
    }

    const normalized = String(value).trim();
    return normalized === '' ? fallback : normalized;
}

function sanitizePhoneNumber(value) {
    const normalized = String(value || '').replace(/[^\d+]/g, '');
    const plusCount = (normalized.match(/\+/g) || []).length;

    if (!normalized || plusCount > 1 || (normalized.includes('+') && !normalized.startsWith('+'))) {
        return '';
    }

    const digitsOnly = normalized.replace(/\+/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        return '';
    }

    return normalized;
}

function buildTelHref(value) {
    const safeNumber = sanitizePhoneNumber(value);
    return safeNumber ? `tel:${safeNumber}` : '#';
}

function reportDataSource(resource, source) {
    console.info(`[weR1] ${resource} loaded via ${source}.`);

    if (!DATA_DEBUG_ENABLED) {
        return;
    }

    upsertDebugBadge(resource, `Loaded via ${source}`);
}

function reportDataFailure(resource, details) {
    console.error(`[weR1] ${resource} failed to load from all sources.`, details);

    if (!DATA_DEBUG_ENABLED) {
        return;
    }

    upsertDebugBadge(
        resource,
        `Load failed (${details.appsScriptError} / ${details.csvError})`,
        true
    );
}

function upsertDebugBadge(resource, message, isError = false) {
    let badgeStack = document.getElementById('dataDebugStack');

    if (!badgeStack) {
        badgeStack = document.createElement('div');
        badgeStack.id = 'dataDebugStack';
        badgeStack.style.position = 'fixed';
        badgeStack.style.right = '16px';
        badgeStack.style.bottom = '16px';
        badgeStack.style.zIndex = '9999';
        badgeStack.style.display = 'grid';
        badgeStack.style.gap = '10px';
        badgeStack.style.maxWidth = '320px';
        document.body.appendChild(badgeStack);
    }

    const badgeId = `debug-badge-${resource}`;
    let badge = document.getElementById(badgeId);

    if (!badge) {
        badge = document.createElement('div');
        badge.id = badgeId;
        badge.style.padding = '10px 12px';
        badge.style.borderRadius = '12px';
        badge.style.boxShadow = '0 10px 30px rgba(15, 23, 42, 0.16)';
        badge.style.fontFamily = 'Inter, sans-serif';
        badge.style.fontSize = '12px';
        badge.style.lineHeight = '1.4';
        badge.style.color = '#0f172a';
        badge.style.background = 'rgba(255, 255, 255, 0.96)';
        badge.style.border = '1px solid rgba(148, 163, 184, 0.35)';
        badge.style.backdropFilter = 'blur(10px)';
        badgeStack.appendChild(badge);
    }

    badge.style.borderColor = isError ? 'rgba(220, 38, 38, 0.35)' : 'rgba(16, 185, 129, 0.35)';
    badge.innerHTML = `<strong style="display:block; margin-bottom:4px;">${escapeHtml(resource)}</strong><span>${escapeHtml(message)}</span>`;
}

function splitMultiValueField(value) {
    if (!value) {
        return [];
    }

    return value
        .split(/[,/|]+/)
        .map(item => item.trim())
        .filter(Boolean);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getTrimmedValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value.trim() : '';
}

function getSelectedRadioValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value.trim() : '';
}

function parseSubmissionResponse(response) {
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    return response.text().then((bodyText) => {
        const trimmedBody = bodyText.trim();

        if (!trimmedBody) {
            throw new Error('Empty response from server.');
        }

        try {
            return JSON.parse(trimmedBody);
        } catch (parseError) {
            if (trimmedBody === 'Success') {
                return { ok: true };
            }

            if (trimmedBody.startsWith('Error:')) {
                throw new Error(trimmedBody.replace(/^Error:\s*/, '') || 'Server returned an error.');
            }

            throw new Error('Unexpected response from server.');
        }
    });
}

function submitFormData(formData) {
    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.trim() === "") {
        return Promise.reject(new Error("Admin has not configured the form submission URL."));
    }

    return fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        body: formData
    })
        .then(parseSubmissionResponse)
        .then((result) => {
            if (!result || result.ok !== true) {
                throw new Error((result && result.error) || 'Submission failed.');
            }

            return result;
        });
}

function updateActiveFiltersTags(search, cat, cls) {
    if (!activeFiltersContainer) {
        return;
    }

    activeFiltersContainer.innerHTML = '';

    const createTag = (text, type) => {
        return `<div class="filter-tag" data-type="${type}" style="cursor: pointer;">${text} <i class="fa-solid fa-xmark"></i></div>`;
    }

    let tagsHTML = '';
    if (search) tagsHTML += createTag(`Search: ${search}`, 'search');
    if (cat) tagsHTML += createTag(`Category: ${cat}`, 'category');
    if (cls) tagsHTML += createTag(`Class: ${cls}`, 'class');

    activeFiltersContainer.innerHTML = tagsHTML;
}

// --- MODAL & FORM LOGIC ---

function openModal() {
    joinModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent bg scale
}

function closeModal() {
    joinModal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Reset form after a slight delay for smooth transition
    setTimeout(() => {
        tutorForm.reset();
        modalFormContent.classList.remove('hidden');
        modalSuccessContent.classList.add('hidden');
    }, 400);
}

function openRequirementModal() {
    requirementModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRequirementModal() {
    requirementModal.classList.remove('active');
    document.body.style.overflow = 'auto';

    setTimeout(() => {
        requirementForm.reset();
        requirementFormContent.classList.remove('hidden');
        requirementSuccessContent.classList.add('hidden');
    }, 400);
}

// Event Listeners for Modal
if (joinBtn) joinBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
if (mobileJoinBtn) mobileJoinBtn.addEventListener('click', (e) => { 
    e.preventDefault(); 
    mobileMenu.classList.remove('active'); // close menu first
    openModal(); 
});
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (successCloseBtn) successCloseBtn.addEventListener('click', closeModal);
if (closeRequirementModalBtn) closeRequirementModalBtn.addEventListener('click', closeRequirementModal);
if (requirementSuccessCloseBtn) requirementSuccessCloseBtn.addEventListener('click', closeRequirementModal);

// Close on outside click
window.addEventListener('click', (e) => {
    if (e.target === joinModal) {
        closeModal();
    }
    if (e.target === requirementModal) {
        closeRequirementModal();
    }
});

// Form Submission Logic
if (tutorForm) {
    tutorForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page reload

        // Button loading state
        submitBtn.disabled = true;
        submitText.textContent = "Submitting...";
        submitSpinner.classList.remove('hidden');

        // Gather form data
        const formData = new FormData();
        formData.append('formType', 'tutor_registration');
        formData.append('Title', getSelectedRadioValue('regTitle'));
        formData.append('Name', getTrimmedValue('regName'));
        formData.append('Category', getTrimmedValue('regCategory'));
        formData.append('Classes', getTrimmedValue('regClasses'));
        formData.append('Subjects', getTrimmedValue('regSubjects'));
        formData.append('HighestQualification', getTrimmedValue('regHighestQualification'));
        formData.append('Area', getTrimmedValue('regArea'));
        formData.append('Phone', getTrimmedValue('regPhone'));
        formData.append('Email', getTrimmedValue('regEmail'));

        submitFormData(formData)
            .then(() => {
                showSuccess();
            })
            .catch(error => {
                console.error("Error submitting form:", error);
                alert(`There was an error submitting your form. ${formatDataError(error)}`);
                resetSubmitBtn();
            });
    });
}

if (requirementForm) {
    requirementForm.addEventListener('submit', (e) => {
        e.preventDefault();

        requirementSubmitBtn.disabled = true;
        requirementSubmitText.textContent = "Submitting...";
        requirementSubmitSpinner.classList.remove('hidden');

        const formData = new FormData();
        formData.append('formType', 'requirement_submission');
        formData.append('Class', getTrimmedValue('reqClass'));
        formData.append('Subjects', getTrimmedValue('reqSubjects'));
        formData.append('Email', getTrimmedValue('reqEmail'));
        formData.append('Location', getTrimmedValue('reqLocation'));
        formData.append('NoLocationConstraint', document.getElementById('reqNoLocation').checked ? 'Yes' : 'No');
        formData.append('ContactNumber', getTrimmedValue('reqContact'));
        formData.append('Notes', getTrimmedValue('reqNotes'));

        submitFormData(formData)
            .then(() => {
                showRequirementSuccess();
            })
            .catch(error => {
                console.error("Error submitting requirement:", error);
                alert(`There was an error submitting the requirement. ${formatDataError(error)}`);
                resetRequirementSubmitBtn();
            });
    });
}

function showSuccess() {
    modalFormContent.classList.add('hidden');
    modalSuccessContent.classList.remove('hidden');
    resetSubmitBtn();
}

function showRequirementSuccess() {
    requirementFormContent.classList.add('hidden');
    requirementSuccessContent.classList.remove('hidden');
    resetRequirementSubmitBtn();
}

function resetSubmitBtn() {
    submitBtn.disabled = false;
    submitText.textContent = "Submit Registration";
    submitSpinner.classList.add('hidden');
}

function resetRequirementSubmitBtn() {
    requirementSubmitBtn.disabled = false;
    requirementSubmitText.textContent = "Submit Requirement";
    requirementSubmitSpinner.classList.add('hidden');
}

// Utils
function showLoader() {
    if (!loader || !tutorsGrid || !noResults || !searchPrompt) {
        return;
    }

    loader.classList.remove('hidden');
    tutorsGrid.classList.add('hidden');
    noResults.classList.add('hidden');
    searchPrompt.classList.add('hidden');
}

function hideLoader() {
    if (loader) {
        loader.classList.add('hidden');
    }
}
