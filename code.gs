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
    var params = e && e.parameter ? e.parameter : {};
    var formType = (params.formType || "").trim();
    var spreadsheet = getSpreadsheet_();

    if (formType === "tutor_registration") {
      return handleTutorRegistration_(spreadsheet, params);
    }

    if (formType === "requirement_submission") {
      return handleRequirementSubmission_(spreadsheet, params);
    }

    throw new Error("Unknown formType. Expected tutor_registration or requirement_submission.");
  } catch (error) {
    return createJsonResponse_({
      ok: false,
      error: error.message
    });
  }
}

function handleTutorRegistration_(spreadsheet, params) {
  var sheet = spreadsheet.getSheetByName(TUTORS_SHEET_NAME);
  if (!sheet) {
    throw new Error("Tutors sheet not found. Update TUTORS_SHEET_NAME in code.gs.");
  }

  var title = sanitizeTextField_(params.Title, 10);
  var name = sanitizeTextField_(params.Name, 100);
  var category = sanitizeTextField_(params.Category, 50);
  var classes = sanitizeTextField_(params.Classes, 100);
  var subjects = sanitizeTextField_(params.Subjects, 200);
  var highestQualification = sanitizeTextField_(params.HighestQualification, 200);
  var area = sanitizeTextField_(params.Area, 100);
  var phone = sanitizePhoneNumber_(params.Phone);
  var email = sanitizeEmail_(params.Email);
  var status = "Pending";

  requireField_(title, "Title");
  requireField_(name, "Name");
  requireField_(category, "Category");
  requireField_(classes, "Classes");
  requireField_(subjects, "Subjects");
  requireField_(highestQualification, "Highest qualification");
  requireField_(area, "Area");
  requireField_(phone, "Phone");
  requireField_(email, "Email");

  if (!isAllowedValue_(category, ["Tuition Teacher", "Coaching Center"])) {
    throw new Error("Category must be Tuition Teacher or Coaching Center.");
  }

  if (!isAllowedValue_(title, ["Mr", "Ms"])) {
    throw new Error("Title must be Mr or Ms.");
  }

  appendRowByHeaders_(sheet, {
    "Title": title,
    "Name": name,
    "Category": category,
    "Classes Taught": classes,
    "Subjects Taught": subjects,
    "Highest Qualification": highestQualification,
    "Area": area,
    "Phone": phone,
    "Email": email,
    "Status": status
  });

  return createJsonResponse_({
    ok: true,
    message: "Tutor registration submitted successfully."
  });
}

function handleRequirementSubmission_(spreadsheet, params) {
  var sheet = spreadsheet.getSheetByName(REQUIREMENTS_SHEET_NAME);
  if (!sheet) {
    throw new Error("Requirements sheet not found. Update REQUIREMENTS_SHEET_NAME in code.gs.");
  }

  var requirementId = createRequirementId_();
  var createdAt = new Date();
  var requirementClass = sanitizeTextField_(params.Class, 100);
  var subjects = sanitizeTextField_(params.Subjects, 200);
  var email = sanitizeEmail_(params.Email);
  var noLocationConstraint = normalizeBooleanLike_(params.NoLocationConstraint) ? "Yes" : "No";
  var location = sanitizeTextField_(params.Location, 120);
  var contactNumber = sanitizePhoneNumber_(params.ContactNumber);
  var notes = sanitizeTextField_(params.Notes, 500);
  var status = "Pending";
  var closedAt = "";

  requireField_(requirementClass, "Class");
  requireField_(subjects, "Subjects");
  requireField_(email, "Email");
  requireField_(contactNumber, "Contact number");

  if (noLocationConstraint !== "Yes") {
    requireField_(location, "Location");
  }

  appendRowByHeaders_(sheet, {
    "Requirement ID": requirementId,
    "Created At": createdAt,
    "Class": requirementClass,
    "Subjects": subjects,
    "Email": email,
    "Location": location,
    "No Location Constraint": noLocationConstraint,
    "Contact Number": contactNumber,
    "Notes": notes,
    "Status": status,
    "Closed At": closedAt
  });

  return createJsonResponse_({
    ok: true,
    message: "Requirement submitted successfully.",
    requirementId: requirementId
  });
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

function appendRowByHeaders_(sheet, valuesByHeader) {
  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  if (!headers || headers.length === 0) {
    throw new Error("Sheet is missing header row.");
  }

  var row = [];
  var foundHeaders = {};
  var requiredHeaders = Object.keys(valuesByHeader);

  for (var i = 0; i < headers.length; i++) {
    var header = String(headers[i] || "").trim();

    if (header && Object.prototype.hasOwnProperty.call(valuesByHeader, header)) {
      row.push(valuesByHeader[header]);
      foundHeaders[header] = true;
    } else {
      row.push("");
    }
  }

  for (var j = 0; j < requiredHeaders.length; j++) {
    if (!foundHeaders[requiredHeaders[j]]) {
      throw new Error("Sheet is missing required header: " + requiredHeaders[j]);
    }
  }

  sheet.appendRow(row);
}

function sanitizeTextField_(value, maxLength) {
  var normalized = String(value || "").trim().replace(/\s+/g, " ");

  if (maxLength && normalized.length > maxLength) {
    throw new Error("Input exceeds maximum allowed length.");
  }

  return protectSheetCellValue_(normalized);
}

function sanitizeEmail_(value) {
  var normalized = String(value || "").trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Invalid email address.");
  }

  if (normalized.length > 254) {
    throw new Error("Email address is too long.");
  }

  return normalized;
}

function sanitizePhoneNumber_(value) {
  var normalized = String(value || "").replace(/[^\d+]/g, "");
  var digitsOnly = normalized.replace(/\+/g, "");
  var plusCount = (normalized.match(/\+/g) || []).length;

  if (!normalized) {
    return "";
  }

  if (plusCount > 1 || (normalized.indexOf("+") > 0)) {
    throw new Error("Invalid phone number.");
  }

  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    throw new Error("Phone number must contain 10 to 15 digits.");
  }

  return normalized;
}

function requireField_(value, fieldName) {
  if (!value) {
    throw new Error(fieldName + " is required.");
  }
}

function isAllowedValue_(value, allowedValues) {
  for (var i = 0; i < allowedValues.length; i++) {
    if (value === allowedValues[i]) {
      return true;
    }
  }

  return false;
}

function normalizeBooleanLike_(value) {
  var normalized = String(value || "").trim().toLowerCase();
  return normalized === "yes" || normalized === "true" || normalized === "1";
}

function protectSheetCellValue_(value) {
  if (!value) {
    return "";
  }

  if (/^[=+\-@]/.test(value)) {
    return "'" + value;
  }

  return value;
}
