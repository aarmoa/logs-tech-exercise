var rp = require("request-promise");
var webtask = require('./logsCheck.js');
var ManagementAPITokenRetriver = webtask.ManagementAPITokenRetriever;
var LogsRetriever = webtask.LogsRetriever;

var settings = {
    AUDIENCE:'https://aarmoa.auth0.com/api/v2/',
    DOMAIN:'aarmoa.auth0.com',
    CLIENT_ID:'DtDcrLXuqyUbadEvZrzX9ZGpckX9E71L',
    CLIENT_SECRET:'XaXL0Mid3z4yXDDjlqOf8ULSI6WMCDl4e0C6__y6R73IVLspVFUII0m7PcJlqnVY',
    GRANT_TYPE:'client_credentials'
};

var tokenRetriever = new ManagementAPITokenRetriver(settings);
var dateFrom = new Date();
var token = tokenRetriever.tokenPromise();
var logsRetriever = new LogsRetriever(settings, token);
var logs = logsRetriever.logsPromise(dateFrom);

console.log('About to call then on result from getLogs');
logs
.then(function (aLogsArray) {
    console.log(aLogsArray);
})
.catch(function (error) {
    throw new Error(error);
});