var rp = require("request-promise");

var settings = {
    AUDIENCE:'',
    DOMAIN:'',
    CLIENT_ID:'',
    CLIENT_SECRET:'',
    GRANT_TYPE:''
}

function getManagementAPIToken(connectionSettings) {
    var options = { 
        method: 'POST',
        url: 'https://' + connectionSettings.DOMAIN + '/oauth/token',
        headers: { 'content-type': 'application/json' },
        body: { 
            grant_type: connectionSettings.GRANT_TYPE,
            client_id: connectionSettings.CLIENT_ID,
            client_secret: connectionSettings.CLIENT_SECRET,
            audience: connectionSettings.AUDIENCE 
        },
        json: true 
    };
  
    return rp(options);
}

var dateFrom = new Date();
var connectionSettings = settings;

    var token = getManagementAPIToken(connectionSettings);
    
    token
    .then(function (aToken) {
        var options = { 
            method: 'GET',
            url: 'https://' + 
                connectionSettings.DOMAIN + 
                '/api/v2/logs?q=type%3A%22w%22%20AND%20date%3A%5B' +
                dateFrom.toISOString().substr(0, 10) + 
                '%20TO%20*%7D%20AND%20description%3AYou%20are%20using%20Auth0%20development%20keys*',
            headers: { 
                authorization: 'Bearer ' + aToken.access_token,
                'content-type': 'application/json' 
            } 
        };
        
        return rp(options).then(function (aLogsArray) {
            console.log(aLogsArray);
        })
        .catch(function (error) {
            throw new Error(error);
        });
    })
    .catch(function (error) {
        throw new Error(error);
    });




