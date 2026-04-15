// This function handles the form submission from your website


function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Map the values sent from the website form
    var name = e.parameter.Name || "";
    var category = e.parameter.Category || "";
    var classes = e.parameter.Classes || "";
    var subjects = e.parameter.Subjects || "";
    var area = e.parameter.Area || "";
    var phone = e.parameter.Phone || "";
    var email = e.parameter.Email || "";
    
    // Every new website registration starts as 'Pending'
    // The Admin must manually change this to 'Approved' in the sheet.
    var status = "Pending";
    
    // Append the data as a new row at the bottom
    sheet.appendRow([name, category, classes, subjects, area, phone, email, status]);
    
    return ContentService.createTextOutput("Success")
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
