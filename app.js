// --- CONFIGURATION ---
// 1. For Reading Data: The CSV URL of your published Google Sheet
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUM0jeipzZXRCK7VnX_lLgX6KRNfNTsK7rtasptLh-uvn3q-TseYyCS_S_tvUhRshe0gR9QhLFHtFN/pub?output=csv";

// 2. For Writing Data: The Web App URL of your deployed Google Apps Script
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx8uNCOMiRgnYNaUSHGUJkUA3mZODDEh_MM7sW-dy33QGjsdCIQg7hLlEnvWbGPxnj9/exec";

// --- DUMMY DATA REMOVED ---
// Data is now fetched live from the Google Sheet above.

// Globals
let tutorsData = [];
let activeTabCategory = '';
let activeClassChip = 'All';

// DOM Elements
const tutorsGrid = document.getElementById('tutorsGrid');
const loader = document.getElementById('loader');
const noResults = document.getElementById('noResults');
const resultsCount = document.getElementById('resultsCount');
const activeFiltersContainer = document.getElementById('activeFiltersContainer');
const classChipsContainer = document.getElementById('classChips');
const dirTabs = document.querySelectorAll('.dir-tab');

// Inputs
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const classFilter = document.getElementById('classFilter');
const searchBtn = document.getElementById('searchBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// Modal Elements
const joinModal = document.getElementById('joinModal');
const joinBtn = document.getElementById('joinBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const tutorForm = document.getElementById('tutorForm');
const modalFormContent = document.getElementById('modalFormContent');
const modalSuccessContent = document.getElementById('modalSuccessContent');
const successCloseBtn = document.getElementById('successCloseBtn');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const submitSpinner = document.getElementById('submitSpinner');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
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

function processData(data) {
    tutorsData = data;
    hideLoader();
    renderClassChips(); // Initial chips
    applyFilters();
}

function renderTutors(dataToRender) {
    tutorsGrid.innerHTML = '';

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
                </div>
                
                <div class="card-actions">
                    <button class="action-btn connect-btn"><i class="fa-solid fa-phone-volume" style="margin-right: 6px;"></i> Connect</button>
                    <!-- Future: <button class="action-btn">View Profile</button> -->
                </div>
            </div>
        `;
        tutorsGrid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function setupEventListeners() {
    categoryFilter.addEventListener('change', () => {
        activeTabCategory = categoryFilter.value;
        syncTabsUI();
        renderClassChips();
        applyFilters();
    });

    classFilter.addEventListener('change', () => {
        activeClassChip = classFilter.value || 'All';
        renderClassChips();
        applyFilters();
    });

    clearFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = '';
        classFilter.value = '';
        activeTabCategory = '';
        activeClassChip = 'All';

        // Sync UI
        syncTabsUI();
        renderClassChips();
        applyFilters();
    });

    // Handle clicking X on tags to clear specific filters
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
            syncTabsUI();
            renderClassChips();
        }
        if (type === 'class') {
            classFilter.value = '';
            activeClassChip = 'All';
            renderClassChips();
        }

        applyFilters();
    });

    // TAB LISTENERS
    dirTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            activeTabCategory = tab.getAttribute('data-category');
            activeClassChip = 'All'; // Reset chip on tab change

            // Update UI
            syncTabsUI();
            renderClassChips();
            applyFilters();
        });
    });

    // CHIP LISTENERS (Delegation)
    if (classChipsContainer) {
        classChipsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip) return;

            activeClassChip = chip.getAttribute('data-value');

            // Sync UI
            const allChips = classChipsContainer.querySelectorAll('.chip');
            allChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            applyFilters();
        });
    }
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    // Use the global state which is now synced with both Tabs and Dropdowns
    const catValue = activeTabCategory;
    const classValue = (activeClassChip === 'All' || activeClassChip === '') ? '' : activeClassChip;

    updateActiveFiltersTags(searchTerm, catValue, classValue);

    const filteredData = tutorsData.filter(tutor => {
        // Enforce Admin Approval Strategy
        // Only show if Status is explicitly Approved (if the column exists)
        if (tutor['Status'] && tutor['Status'].toLowerCase().trim() !== 'approved') {
            return false;
        }

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

function updateActiveFiltersTags(search, cat, cls) {
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

// --- REDESIGN UTILS (V3) ---

function syncTabsUI() {
    dirTabs.forEach(tab => {
        if (tab.getAttribute('data-category') === activeTabCategory) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function renderClassChips() {
    if (!classChipsContainer) return;

    // Determine relevant data based on active tab
    const relevantData = tutorsData.filter(t => {
        const approved = t['Status'] && t['Status'].toLowerCase().trim() === 'approved';
        const matchesCategory = activeTabCategory === '' || t['Category'] === activeTabCategory;
        return approved && matchesCategory;
    });

    // Extract unique classes
    const classesSet = new Set();
    relevantData.forEach(t => {
        if (t['Classes Taught']) {
            // Some might be "6 to 10, 11 to 12" -> we split or just keep as is?
            // For discovery, let's keep the exact values found in data strings for now
            classesSet.add(t['Classes Taught']);
        }
    });

    const uniqueClasses = Array.from(classesSet).sort();

    let chipsHTML = `<div class="chip ${activeClassChip === 'All' ? 'active' : ''}" data-value="All">All Classes</div>`;

    uniqueClasses.forEach(c => {
        const isActive = activeClassChip === c ? 'active' : '';
        chipsHTML += `<div class="chip ${isActive}" data-value="${c}">${c}</div>`;
    });

    classChipsContainer.innerHTML = chipsHTML;
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

// Event Listeners for Modal
if (joinBtn) joinBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (successCloseBtn) successCloseBtn.addEventListener('click', closeModal);

// Close on outside click
window.addEventListener('click', (e) => {
    if (e.target === joinModal) {
        closeModal();
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
        formData.append('Name', document.getElementById('regName').value);
        formData.append('Category', document.getElementById('regCategory').value);
        formData.append('Classes', document.getElementById('regClasses').value);
        formData.append('Subjects', document.getElementById('regSubjects').value);
        formData.append('Area', document.getElementById('regArea').value);
        formData.append('Contact', document.getElementById('regContact').value);

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

function showSuccess() {
    modalFormContent.classList.add('hidden');
    modalSuccessContent.classList.remove('hidden');
    resetSubmitBtn();
}

function resetSubmitBtn() {
    submitBtn.disabled = false;
    submitText.textContent = "Submit Registration";
    submitSpinner.classList.add('hidden');
}

// Utils
function showLoader() {
    loader.classList.remove('hidden');
    tutorsGrid.classList.add('hidden');
    noResults.classList.add('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
}
