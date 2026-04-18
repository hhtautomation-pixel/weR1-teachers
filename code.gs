var TUTORS_SHEET_NAME = "Tutors";
var REQUIREMENTS_SHEET_NAME = "Requirements";

function doPost(e) {
  try {
    var formType = (e.parameter.formType || "").trim();
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (formType === "tutor_registration") {
      return handleTutorRegistration_(spreadsheet, e.parameter);
    }

    if (formType === "requirement_submission") {
      return handleRequirementSubmission_(spreadsheet, e.parameter);
    }

    throw new Error("Unknown formType. Expected tutor_registration or requirement_submission.");
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function handleTutorRegistration_(spreadsheet, params) {
  var sheet = spreadsheet.getSheetByName(TUTORS_SHEET_NAME);
  if (!sheet) {
    throw new Error("Tutors sheet not found. Update TUTORS_SHEET_NAME in code.gs.");
  }

  var name = params.Name || "";
  var category = params.Category || "";
  var classes = params.Classes || "";
  var subjects = params.Subjects || "";
  var area = params.Area || "";
  var phone = params.Phone || "";
  var email = params.Email || "";
  var status = "Pending";

  sheet.appendRow([name, category, classes, subjects, area, phone, email, status]);

  return ContentService.createTextOutput("Success")
    .setMimeType(ContentService.MimeType.TEXT);
}

function handleRequirementSubmission_(spreadsheet, params) {
  var sheet = spreadsheet.getSheetByName(REQUIREMENTS_SHEET_NAME);
  if (!sheet) {
    throw new Error("Requirements sheet not found. Update REQUIREMENTS_SHEET_NAME in code.gs.");
  }

  var requirementId = createRequirementId_();
  var createdAt = new Date();
  var requirementClass = params.Class || "";
  var subjects = params.Subjects || "";
  var email = params.Email || "";
  var location = params.Location || "";
  var noLocationConstraint = params.NoLocationConstraint || "No";
  var contactNumber = params.ContactNumber || "";
  var notes = params.Notes || "";
  var status = "Pending";
  var closedAt = "";

  sheet.appendRow([
    requirementId,
    createdAt,
    requirementClass,
    subjects,
    email,
    location,
    noLocationConstraint,
    contactNumber,
    notes,
    status,
    closedAt
  ]);

  return ContentService.createTextOutput("Success")
    .setMimeType(ContentService.MimeType.TEXT);
}

function createRequirementId_() {
  return "REQ-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
}
