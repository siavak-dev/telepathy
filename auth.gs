var cc = DataStudioApp.createCommunityConnector();

// https://developers.google.com/datastudio/connector/reference#getauthtype
function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.OAUTH2)
    .build();
}

// https://developers.google.com/datastudio/connector/reference#isauthvalid
function isAuthValid() {
  return ScriptApp.getOAuthToken() != null;
}

// https://developers.google.com/datastudio/connector/reference#setauthentication
function setCredentials(request) {
  var token = ScriptApp.getOAuthToken();
  return cc.newSetCredentialsResponse().setCredentials(token).build();
}

// https://developers.google.com/datastudio/connector/reference#resetauthentication
function resetAuth() {
  // Clear any stored OAuth credentials.
}

// https://developers.google.com/datastudio/connector/reference#get3PAuthorizationUrls
function get3PAuthorizationUrls() {
  var oauth2Service = getOAuthService();
  var authorizationUrl = oauth2Service.getAuthorizationUrl();
  return cc.newGet3PAuthorizationUrlsResponse()
    .setAuthorizationUrl(authorizationUrl)
    .build();
}

function getOAuthService() {
  return OAuth2.createService('googleSheets')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId('YOUR_CLIENT_ID')
    .setClientSecret('YOUR_CLIENT_SECRET')
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('https://www.googleapis.com/auth/spreadsheets.readonly')
    .setParam('access_type', 'offline')
    .setParam('prompt', 'consent')
    .setProjectKey('YOUR_PROJECT_KEY'); // optional
}

function authCallback(request) {
  var oauth2Service = getOAuthService();
  var authorized = oauth2Service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}
