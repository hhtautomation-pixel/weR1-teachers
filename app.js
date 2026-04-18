// --- CONFIGURATION ---
// 1. For Reading Data: The CSV URL of your published Google Sheet
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUM0jeipzZXRCK7VnX_lLgX6KRNfNTsK7rtasptLh-uvn3q-TseYyCS_S_tvUhRshe0gR9QhLFHtFN/pub?gid=0&single=true&output=csv";

// 1b. For Reading Requirement Notices: replace this local sample with the published Requirements-tab CSV URL
const REQUIREMENTS_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUM0jeipzZXRCK7VnX_lLgX6KRNfNTsK7rtasptLh-uvn3q-TseYyCS_S_tvUhRshe0gR9QhLFHtFN/pub?gid=1772117371&single=true&output=csv";

// 2. For Writing Data: The Web App URL of your deployed Google Apps Script
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx8uNCOMiRgnYNaUSHGUJkUA3mZODDEh_MM7sW-dy33QGjsdCIQg7hLlEnvWbGPxnj9/exec";

// --- DUMMY DATA REMOVED ---
// Data is now fetched live from the Google Sheet above.

// Globals
let tutorsData = [];
let requirementsData = [];
let activeTabCategory = '';
let activeClassChip = 'All';
let hasCommittedSearch = false;

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

    if (GOOGLE_SHEET_CSV_URL && GOOGLE_SHEET_CSV_URL.trim() !== "") {
        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                processData(results.data);
            },
            error: function (error) {
                console.error("Error fetching Google Sheet:", error);
                resultsCount.textContent = "Error loading data. Please check your sheet connection.";
                hideLoader();
            }
        });
    } else {
        resultsCount.textContent = "Configuration Missing: Please provide a Google Sheet URL.";
        hideLoader();
    }
}

function fetchRequirementsData() {
    showRequirementsLoader();

    if (!REQUIREMENTS_SHEET_CSV_URL || REQUIREMENTS_SHEET_CSV_URL.trim() === "") {
        showRequirementsSetup();
        return;
    }

    Papa.parse(REQUIREMENTS_SHEET_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            requirementsData = results.data;
            renderRequirements();
        },
        error: function (error) {
            console.error("Error fetching requirements sheet:", error);
            showRequirementsEmpty("Could not load the requirements board right now.");
        }
    });
}

function processData(data) {
    tutorsData = data;
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
        const initials = tutor['Name'] ? tutor['Name'].substring(0, 2).toUpperCase() : 'W1';

        // Ensure values strictly exist
        const type = tutor['Category'] || 'Educator';
        const classes = tutor['Classes Taught'] || 'N/A';
        const subjects = tutor['Subjects Taught'] || 'N/A';
        const area = tutor['Area'] || 'Kolkata';

        // Add staggered animation delay
        const delay = (index % 10) * 0.1;

        const cardHTML = `
            <div class="tutor-card fade-up" style="animation-delay: ${delay}s">
                <div class="card-header">
                    <div class="avatar-placeholder">${initials}</div>
                    <span class="tutor-type">${type}</span>
                </div>
                
                <div class="tutor-info">
                    <h3>${tutor['Name']}</h3>
                    <div class="tutor-location">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${area}</span>
                    </div>
                </div>
                
                <div class="tutor-details">
                    <div class="detail-row">
                        <i class="fa-solid fa-book-open detail-icon"></i>
                        <div class="detail-content">
                            <span class="detail-label">SUBJECTS</span>
                            <span>${subjects}</span>
                        </div>
                    </div>
                    
                    <div class="detail-row">
                        <i class="fa-solid fa-chalkboard-user detail-icon"></i>
                        <div class="detail-content">
                            <span class="detail-label">CLASSES</span>
                            <span>${classes}</span>
                        </div>
                    </div>

                    <div class="detail-row">
                        <i class="fa-solid fa-envelope detail-icon"></i>
                        <div class="detail-content">
                            <span class="detail-label">EMAIL</span>
                            <span>${tutor['Email'] || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <a href="tel:${tutor['Phone']}" class="action-btn connect-btn"><i class="fa-solid fa-phone-volume" style="margin-right: 6px;"></i> Call ${tutor['Phone'] || 'Tutor'}</a>
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
        ? openRequirements.map(requirement => buildRequirementCardMarkup(requirement, false)).join("")
        : `<div class="requirement-card"><h4>No Open Requirements</h4><p class="requirement-summary">Approved teaching requirements will appear here as soon as they are available.</p></div>`;

    closedRequirementsList.innerHTML = closedRequirements.length
        ? closedRequirements.map(requirement => buildRequirementCardMarkup(requirement, true)).join("")
        : `<div class="requirement-card closed-card"><h4>No Closed Requirements Yet</h4><p class="requirement-summary">Closed notices will appear here once the admin marks a requirement as closed.</p></div>`;

    openRequirementsCount.textContent = `${openRequirements.length} Open`;
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
            <a href="tel:${escapeHtml(requirement['Contact Number'] || requirement['Contact'] || '')}" class="action-btn connect-btn">
                <i class="fa-solid fa-phone-volume" style="margin-right: 6px;"></i> Call ${escapeHtml(requirement['Contact Number'] || requirement['Contact'] || 'Now')}
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
                <a href="tel:${escapeHtml(requirement['Contact Number'] || requirement['Contact'] || '')}" class="action-btn connect-btn">
                    <i class="fa-solid fa-phone-volume" style="margin-right: 6px;"></i> Call
                </a>
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
        formData.append('Name', document.getElementById('regName').value);
        formData.append('Category', document.getElementById('regCategory').value);
        formData.append('Classes', document.getElementById('regClasses').value);
        formData.append('Subjects', document.getElementById('regSubjects').value);
        formData.append('Area', document.getElementById('regArea').value);
        formData.append('Phone', document.getElementById('regPhone').value);
        formData.append('Email', document.getElementById('regEmail').value);

        // If no Apps Script URL is set, alert the user
        if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.trim() === "") {
            alert("Registration Error: Admin has not configured the form submission URL.");
            resetSubmitBtn();
            return;
        }

        // Send data to Apps Script
        fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
            .then(response => {
                // Assume success if fetch doesn't throw, since we might run into CORS depending on GAS setup
                showSuccess();
            })
            .catch(error => {
                console.error("Error submitting form:", error);
                alert("There was an error submitting your form. Please try again.");
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
        formData.append('Class', document.getElementById('reqClass').value);
        formData.append('Subjects', document.getElementById('reqSubjects').value);
        formData.append('Email', document.getElementById('reqEmail').value);
        formData.append('Location', document.getElementById('reqLocation').value);
        formData.append('NoLocationConstraint', document.getElementById('reqNoLocation').checked ? 'Yes' : 'No');
        formData.append('ContactNumber', document.getElementById('reqContact').value);
        formData.append('Notes', document.getElementById('reqNotes').value);

        if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.trim() === "") {
            alert("Requirement Error: Admin has not configured the form submission URL.");
            resetRequirementSubmitBtn();
            return;
        }

        fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
            .then(() => {
                showRequirementSuccess();
            })
            .catch(error => {
                console.error("Error submitting requirement:", error);
                alert("There was an error submitting the requirement. Please try again.");
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
