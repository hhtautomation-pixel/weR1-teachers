const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createElementStub() {
  return {
    value: '',
    checked: false,
    innerHTML: '',
    textContent: '',
    style: {},
    classList: {
      add() {},
      remove() {}
    },
    appendChild() {},
    addEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    reset() {},
    closest() {
      return null;
    },
    getAttribute() {
      return null;
    }
  };
}

function loadAppJs() {
  const source = fs.readFileSync(path.join(process.cwd(), 'app.js'), 'utf8');
  const elementCache = new Map();

  const documentStub = {
    body: {
      style: {},
      appendChild() {}
    },
    getElementById(id) {
      if (!elementCache.has(id)) {
        elementCache.set(id, createElementStub());
      }

      return elementCache.get(id);
    },
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    },
    addEventListener() {},
    createElement() {
      return createElementStub();
    }
  };

  const sandbox = {
    console,
    URLSearchParams,
    document: documentStub,
    window: {
      location: { search: '' },
      addEventListener() {}
    },
    fetch() {
      throw new Error('fetch should not be called during unit tests');
    },
    FormData: class FormDataStub {
      constructor() {
        this.data = [];
      }
      append(key, value) {
        this.data.push([key, value]);
      }
    },
    Papa: {},
    setTimeout(fn) {
      return fn();
    },
    clearTimeout() {}
  };

  vm.runInNewContext(source, sandbox, { filename: 'app.js' });
  return sandbox;
}

function loadCodeGs() {
  const source = fs.readFileSync(path.join(process.cwd(), 'code.gs'), 'utf8');
  const sandbox = {
    console,
    ContentService: {
      MimeType: {
        JSON: 'application/json'
      },
      createTextOutput(text) {
        return {
          text,
          mimeType: null,
          setMimeType(mimeType) {
            this.mimeType = mimeType;
            return this;
          }
        };
      }
    },
    Utilities: {
      formatDate() {
        return '20260419-120000';
      }
    },
    Session: {
      getScriptTimeZone() {
        return 'Asia/Calcutta';
      }
    },
    SpreadsheetApp: {
      openById() {
        throw new Error('SpreadsheetApp.openById should not be called in unit tests');
      },
      getActiveSpreadsheet() {
        return null;
      }
    },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty() {
            return '';
          }
        };
      }
    },
    Date
  };

  vm.runInNewContext(source, sandbox, { filename: 'code.gs' });
  return sandbox;
}

function parseJsonResponse(response) {
  return JSON.parse(response.text);
}

function createSpreadsheetMock(sheetName, headers) {
  const rows = [];

  return {
    rows,
    spreadsheet: {
      getSheetByName(name) {
        if (name !== sheetName) {
          return null;
        }

        return {
          getLastColumn() {
            return headers.length;
          },
          getRange(row, column, numRows, numColumns) {
            if (row !== 1 || column !== 1 || numRows !== 1 || numColumns !== headers.length) {
              throw new Error('Unexpected range requested in test');
            }

            return {
              getValues() {
                return [headers];
              }
            };
          },
          appendRow(row) {
            rows.push(row);
          }
        };
      }
    }
  };
}

async function run() {
  const app = loadAppJs();
  const gas = loadCodeGs();

  assert.equal(
    app.escapeHtml('<img src=x onerror=alert(1)>'),
    '&lt;img src=x onerror=alert(1)&gt;'
  );

  assert.equal(app.buildTelHref('javascript:alert(1)'), '#');
  assert.equal(app.buildTelHref('+91 98765 43210'), 'tel:+919876543210');
  assert.equal(app.safeDisplayText('   ', 'fallback'), 'fallback');
  assert.equal(app.getSelectedRadioValue('missingRadio'), '');

  const maliciousTitle = app.buildRequirementTitle({
    Class: '<script>alert(1)</script>',
    Subjects: 'Maths',
    Location: 'Park Circus'
  });
  assert.ok(maliciousTitle.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!maliciousTitle.includes('<script>'));

  const accordionMarkup = app.buildOpenRequirementAccordionMarkup({
    Status: 'Open',
    Class: 'Class 5',
    Subjects: 'Maths',
    Location: 'Park Circus',
    Notes: 'Evening preferred',
    'Contact Number': '9876543210',
    'Created At': '2026-04-18T00:00:00Z'
  }, 0);
  assert.ok(accordionMarkup.includes('View Details'));
  assert.ok(accordionMarkup.includes('Class 5'));
  assert.ok(accordionMarkup.includes('Park Circus'));

  const parsedJson = await app.parseSubmissionResponse({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ ok: true, message: 'done' })
  });
  assert.equal(parsedJson.ok, true);

  await assert.rejects(
    () =>
      app.parseSubmissionResponse({
        ok: true,
        status: 200,
        text: async () => 'Error: bad request'
      }),
    /bad request/
  );

  assert.equal(gas.sanitizeEmail_(' Test@Example.com '), 'test@example.com');
  assert.equal(gas.sanitizePhoneNumber_('+91 98765 43210'), '+919876543210');
  assert.equal(gas.protectSheetCellValue_('=SUM(A1:A2)'), "'=SUM(A1:A2)");

  assert.throws(() => gas.sanitizeEmail_('bad-email'), /Invalid email address/);
  assert.throws(() => gas.sanitizePhoneNumber_('12345'), /10 to 15 digits/);
  assert.throws(
    () =>
      gas.appendRowByHeaders_(
        createSpreadsheetMock('Tutors', ['Name']).spreadsheet.getSheetByName('Tutors'),
        { Name: 'Alice', Email: 'alice@example.com' }
      ),
    /Sheet is missing required header: Email/
  );

  const tutorHeaders = [
    'Status',
    'Email',
    'Title',
    'Subjects Taught',
    'Category',
    'Area',
    'Phone',
    'Highest Qualification',
    'Name',
    'Classes Taught'
  ];
  const tutorMock = createSpreadsheetMock('Tutors', tutorHeaders);
  const tutorResponse = gas.handleTutorRegistration_(tutorMock.spreadsheet, {
    Title: 'Mr',
    Name: '  Alice  ',
    Category: 'Tuition Teacher',
    Classes: '=6 to 10',
    Subjects: 'Maths',
    HighestQualification: 'B.Sc Mathematics',
    Area: 'Park Circus',
    Phone: '9876543210',
    Email: 'Alice@example.com'
  });
  const tutorPayload = parseJsonResponse(tutorResponse);
  assert.equal(tutorPayload.ok, true);
  assert.equal(tutorMock.rows.length, 1);
  assert.deepEqual(Array.from(tutorMock.rows[0]), [
    'Pending',
    'alice@example.com',
    'Mr',
    'Maths',
    'Tuition Teacher',
    'Park Circus',
    '9876543210',
    'B.Sc Mathematics',
    'Alice',
    "'=6 to 10"
  ]);

  assert.throws(
    () =>
      gas.handleTutorRegistration_(tutorMock.spreadsheet, {
        Name: 'Bob',
        Title: 'Mr',
        Category: 'Other',
        Classes: '6 to 10',
        Subjects: 'Maths',
        HighestQualification: 'M.Sc',
        Area: 'Area',
        Phone: '9876543210',
        Email: 'bob@example.com'
      }),
    /Category must be Tuition Teacher or Coaching Center/
  );

  assert.throws(
    () =>
      gas.handleTutorRegistration_(tutorMock.spreadsheet, {
        Name: 'Charlie',
        Title: 'Mr',
        Category: 'Tuition Teacher',
        Classes: '6 to 10',
        Subjects: 'Maths',
        HighestQualification: '',
        Area: 'Area',
        Phone: '9876543210',
        Email: 'charlie@example.com'
    }),
    /Highest qualification is required/
  );

  assert.throws(
    () =>
      gas.handleTutorRegistration_(tutorMock.spreadsheet, {
        Title: '',
        Name: 'Diana',
        Category: 'Tuition Teacher',
        Classes: '6 to 10',
        Subjects: 'Maths',
        HighestQualification: 'M.A.',
        Area: 'Area',
        Phone: '9876543210',
        Email: 'diana@example.com'
      }),
    /Title is required/
  );

  assert.throws(
    () =>
      gas.handleTutorRegistration_(tutorMock.spreadsheet, {
        Title: 'Mrs',
        Name: 'Eva',
        Category: 'Tuition Teacher',
        Classes: '6 to 10',
        Subjects: 'Maths',
        HighestQualification: 'M.A.',
        Area: 'Area',
        Phone: '9876543210',
        Email: 'eva@example.com'
      }),
    /Title must be Mr or Ms/
  );

  const requirementHeaders = [
    'Status',
    'Notes',
    'Closed At',
    'Contact Number',
    'Email',
    'Location',
    'Subjects',
    'Requirement ID',
    'Created At',
    'No Location Constraint',
    'Class'
  ];
  const reqMock = createSpreadsheetMock('Requirements', requirementHeaders);
  const reqResponse = gas.handleRequirementSubmission_(reqMock.spreadsheet, {
    Class: 'Class 6',
    Subjects: 'Science',
    Email: 'parent@example.com',
    Location: '',
    NoLocationConstraint: 'Yes',
    ContactNumber: '9876543210',
    Notes: '@evening batch'
  });
  const reqPayload = parseJsonResponse(reqResponse);
  assert.equal(reqPayload.ok, true);
  assert.equal(reqMock.rows.length, 1);
  assert.equal(reqMock.rows[0][0], 'Pending');
  assert.equal(reqMock.rows[0][1], "'@evening batch");
  assert.equal(reqMock.rows[0][3], '9876543210');
  assert.equal(reqMock.rows[0][7], 'REQ-20260419-120000');
  assert.equal(reqMock.rows[0][9], 'Yes');
  assert.equal(reqMock.rows[0][10], 'Class 6');

  assert.throws(
    () =>
      gas.handleRequirementSubmission_(reqMock.spreadsheet, {
        Class: 'Class 6',
        Subjects: 'Science',
        Email: 'parent@example.com',
        Location: '',
        NoLocationConstraint: 'No',
        ContactNumber: '9876543210',
        Notes: ''
      }),
    /Location is required/
  );

  console.log('All security and validation tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
