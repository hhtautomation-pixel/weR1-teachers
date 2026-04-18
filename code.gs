var TUTORS_SHEET_NAME = "Tutors";
var REQUIREMENTS_SHEET_NAME = "Requirements";
var SPREADSHEET_ID = "111BKs-mtJk-fEx_fXGTIqsuAeH7HcAOo6-9gzfTVARk";

function doGet(e) {
  try {
    var resource = (e.parameter.resource || "").trim();
    var spreadsheet = getSpreadsheet_();

    if (resource === "tutors") {
      return createJsonResponse_(getSheetRows_(spreadsheet, TUTORS_SHEET_NAME));
    }

    if (resource === "requirements") {
      return createJsonResponse_(getSheetRows_(spreadsheet, REQUIREMENTS_SHEET_NAME));
    }

    return createJsonResponse_({
      ok: true,
      message: "Apps Script endpoint is live.",
      availableResources: ["tutors", "requirements"]
    });
  } catch (error) {
    return createJsonResponse_({
      ok: false,
      error: error.message
    });
  }
}

function doPost(e) {
  try {
    var formType = (e.parameter.formType || "").trim();
    var spreadsheet = getSpreadsheet_();

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

function getSpreadsheet_() {
  var configuredSpreadsheetId = SPREADSHEET_ID;

  if (!configuredSpreadsheetId) {
    configuredSpreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  }

  if (configuredSpreadsheetId) {
    return SpreadsheetApp.openById(configuredSpreadsheetId);
  }

  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (activeSpreadsheet) {
    return activeSpreadsheet;
  }

  throw new Error(
    "Spreadsheet connection is not configured. Set SPREADSHEET_ID in code.gs or in Script Properties."
  );
}

function getSheetRows_(spreadsheet, sheetName) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(sheetName + " sheet not found.");
  }

  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) {
    return [];
  }

  var headers = values[0];
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var rowValues = values[i];
    var rowObject = {};

    for (var j = 0; j < headers.length; j++) {
      rowObject[headers[j]] = rowValues[j];
    }

    rows.push(rowObject);
  }

  return rows;
}

function createJsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
