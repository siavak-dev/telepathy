

var cc = DataStudioApp.createCommunityConnector();

// [START get_config]
/**
 * Returns the user configurable options for the connector.
 *
 * @param {Object} request The request object.
 * @returns {Object} The configuration object for the connector.
 */
function getConfig(request) {
  var config = cc.getConfig();

  config
    .newInfo()
    .setId('instructions')
    .setText(
      'This connector logs an input parameter and a timestamp to a single specified sheet in your Google Sheet.'
    );

  // Input for the Google Sheet URL
  config
    .newTextInput()
    .setId('spreadsheetUrl')
    .setName('Google Sheet URL')
    .setPlaceholder('Enter the Google Sheet URL here')
    .setHelpText(
      'Provide the full URL of your Google Sheet. The connector will extract the spreadsheet ID from this URL.'
    );

  // Input for the single sheet name used for logging and reading
  config
    .newTextInput()
    .setId('sheetName')
    .setName('Sheet Name')
    .setPlaceholder('Enter the name of the sheet for logging and reading')
    .setHelpText('The name of the sheet where data will be logged and read from.');

  // Input for the parameter to be logged
  config
    .newTextInput()
    .setId('input_parameter')
    .setName('Input Parameter')
    .setPlaceholder('Enter the value to log')
    .setHelpText('This value will be sent to your Google Sheet.')
    .setAllowOverride(true);

  // Single select field to trigger the send action
  config
    .newSelectSingle()
    .setId('sendStatus')
    .setName('Send Status')
    .setHelpText('Choose "send" to log the data to the sheet and trigger the webhook.')
    .addOption(config.newOptionBuilder().setLabel(' ').setValue('')) // Blank option
    .addOption(config.newOptionBuilder().setLabel('Auto Send').setValue('send'))
    .setAllowOverride(true);

  // Input for the webhook URL
  config
    .newTextInput()
    .setId('webhookUrl')
    .setName('Webhook URL')
    .setPlaceholder('Enter the webhook URL')
    .setHelpText('URL to send webhook requests when data is sent.');

  config.setDateRangeRequired(false);
  return config.build();
}
// [END get_config]

// [START get_schema]
/**
 * Returns the schema for the given request.
 *
 * @param {Object} request The request object.
 * @returns {Object} The schema for the given request.
 */
function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}

/**
 * Returns the fields for the connector.
 *
 * @param {Object} request The request object.
 * @returns {Object} The fields for the connector.
 */
function getFields(request) {
  var fields = cc.getFields();
  var types = cc.FieldType;

  // Fetch headers from the sheet dynamically
  var headers = getSheetHeaders(request);

  headers.forEach(function (header) {
    var fieldId = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
    fields
      .newDimension()
      .setId(fieldId)
      .setName(header)
      .setType(types.TEXT);
  });

  return fields;
}
// [END get_schema]

// [START get_data]
/**
 * Returns the tabular data for the given request.
 *
 * @param {Object} request The request object.
 * @returns {Object} The tabular data for the given request.
 */
function getData(request) {
  request.configParams = validateConfig(request.configParams);

  // Log the input parameter and timestamp to the sheet if sendStatus is 'send'
  if (request.configParams.sendStatus === 'send') {
    try {
      logToSheet(request.configParams);
      // Trigger webhook when data is sent
      sendWebhook(request.configParams.webhookUrl, 'green');
    } catch (e) {
      cc.newUserError()
        .setDebugText('Error logging data to sheet. Exception details: ' + e)
        .setText('The connector encountered an error while logging your data. Please try again.')
        .throwException();
    }
  }

  var requestedFieldIds = request.fields.map(function (field) {
    return field.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  });
  var requestedFields = getFields(request).forIds(requestedFieldIds);

  try {
    var apiResponse = fetchDataFromSheet(request);
    var data = getFormattedData(apiResponse, requestedFields);
  } catch (e) {
    cc.newUserError()
      .setDebugText('Error fetching data from Sheet. Exception details: ' + e)
      .setText(
        'The connector has encountered an unrecoverable error. Please try again later.'
      )
      .throwException();
  }

  return {
    schema: requestedFields.build(),
    rows: data,
  };
}
// [END get_data]

/**
 * Fetches data from the specified Google Sheet.
 * @param {Object} request The request object.
 * @returns {Array} The data from the sheet.
 */
function fetchDataFromSheet(request) {
  var spreadsheetId = extractSpreadsheetId(request.configParams.spreadsheetUrl);
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(
    request.configParams.sheetName
  );
  var values = sheet.getDataRange().getValues();
  var headers = values.shift() || []; // Get headers, handle empty sheet

  var data = values.map(function (row) {
    var rowData = {};
    row.forEach(function (value, index) {
      if (headers[index]) {
        var headerId = headers[index].toLowerCase().replace(/[^a-z0-9]/g, '_');
        rowData[headerId] = value;
      }
    });
    return rowData;
  });

  return data;
}

/**
 * Formats the data from the Google Sheet into the required format for Data Studio.
 * @param {Array} sheetData The data from the sheet.
 * @param {Object} requestedFields The fields requested by Data Studio.
 * @returns {Array} The formatted data.
 */
function getFormattedData(sheetData, requestedFields) {
  return sheetData.map(function (rowData) {
    var formattedRow = requestedFields.asArray().map(function (requestedField) {
      return rowData[requestedField.getId()] || ''; // Use field ID as key, default to empty string
    });
    return { values: formattedRow };
  });
}

/**
 * Fetches headers from the specified sheet dynamically.
 * @param {Object} request The request object.
 * @returns {Array} The headers from the sheet.
 */
function getSheetHeaders(request) {
  if (!request.configParams || !request.configParams.spreadsheetUrl || !request.configParams.sheetName) {
    return [];
  }
  try {
    var spreadsheetId = extractSpreadsheetId(request.configParams.spreadsheetUrl);
    var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(
      request.configParams.sheetName
    );
    // If the sheet doesn't exist or is empty, return default headers for schema
    if (!sheet || sheet.getLastRow() === 0) {
        return ['input_parameter', 'Timestamp'];
    }
    var headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    return headers;
  } catch(e) {
    // If there's an error (e.g., invalid URL), return default headers
    return ['input_parameter', 'Timestamp'];
  }
}


/**
 * Extracts the spreadsheet ID from the Google Sheet URL.
 * @param {string} url The Google Sheet URL.
 * @returns {string|null} The spreadsheet ID or null if not found.
 */
function extractSpreadsheetId(url) {
  if (!url) return null;
  var matches = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : null;
}

/**
 * Logs the input parameter and timestamp to the specified Google Sheet.
 * @param {Object} configParams The configuration parameters.
 */
function logToSheet(configParams) {
  var SPREADSHEET_ID = extractSpreadsheetId(configParams.spreadsheetUrl);
  if (!SPREADSHEET_ID) {
    throw new Error('Invalid Spreadsheet URL');
  }
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(
    configParams.sheetName
  );
  if (!sheet) {
    // Or create it if you prefer:
    // sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(configParams.sheetName);
    throw new Error('Sheet with name "' + configParams.sheetName + '" not found.');
  }
  
  var lastRow = sheet.getLastRow();

  // Prepare data to log: input_parameter and Timestamp
  var timestamp = formatTimestamp(new Date());
  var dataToLog = [
    configParams.input_parameter || 'No value provided',
    timestamp
  ];

  // Set headers if the sheet is empty
  if (lastRow === 0) {
    sheet.appendRow(['input_parameter', 'Timestamp']);
  }

  // Append the new data to the next available row
  sheet.appendRow(dataToLog);
}

/**
 * Helper function to format a date object into a string.
 * @param {Date} date The date object to format.
 * @returns {string} The formatted timestamp string.
 */
function formatTimestamp(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Sends a webhook request with a specific payload.
 * @param {string} webhookUrl The URL to send the request to.
 * @param {string} payload The payload to send.
 */
function sendWebhook(webhookUrl, payload) {
  if (!webhookUrl) {
    Logger.log('No webhook URL provided.');
    return;
  }

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify({ status: payload }),
  };

  try {
    UrlFetchApp.fetch(webhookUrl, options);
    Logger.log('Webhook sent successfully with payload: ' + payload);
  } catch (e) {
    Logger.log('Error sending webhook. Exception details: ' + e);
  }
}

/**
 * Validates the configuration parameters.
 * @param {Object} configParams The configuration parameters.
 * @returns {Object} The validated configuration parameters.
 */
function validateConfig(configParams) {
  configParams = configParams || {};
  configParams.input_parameter = configParams.input_parameter || '';
  configParams.sendStatus = configParams.sendStatus || '';
  return configParams;
}

/**
 * Returns whether the current user is an admin user.
 * This function is required by the Data Studio connector infrastructure.
 * @returns {boolean} True if the current user is an admin, false otherwise.
 */
function isAdminUser() {
  // For this connector, we'll return false. You can implement your own logic here.
  return true;
}
