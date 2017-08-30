var rp = require('request-promise');

function DummyNotifier(logs) {};
DummyNotifier.prototype.notify = function(notificationChannel) {
    console.log('No logs to be notified were detected.')
};

function WarningLogsNotifier(logs) {
    if(logs.lenght === 0) {
        new Error('A WarningLogsNotifier should be created with at least one log');
    }
    this.description = logs[0].description;
    this.clients = new Set(logs.map(function(aLog) {
        return aLog.client_id
    }));
};
WarningLogsNotifier.prototype.notify = function(notificationChannel) {
    notificationChannel.notify(this);
};

function NotifierBuilder() {};
NotifierBuilder.prototype.build = function(logs) {
   var notificationClass;
   
   if(logs.length > 0) {
       notificationClass = WarningLogsNotifier;
   } else {
       notificationClass = DummyNotifier;
   };
   
   return new notificationClass(logs);
};

function ManagementAPITokenRetriever(aConnectionSettings) {
    this.connectionSettings = aConnectionSettings;
}
ManagementAPITokenRetriever.prototype.tokenPromise = function() {
    var options = { 
        method: 'POST',
        url: 'https://' + this.connectionSettings.DOMAIN + '/oauth/token',
        headers: { 'content-type': 'application/json' },
        body: { 
            grant_type: this.connectionSettings.GRANT_TYPE,
            client_id: this.connectionSettings.CLIENT_ID,
            client_secret: this.connectionSettings.CLIENT_SECRET,
            audience: this.connectionSettings.AUDIENCE 
        },
        json: true 
    };
  
    return rp(options);
};

function LogsRetriever(aConnectionSettings, aTokenPromise) {
    this.connectionSettings = aConnectionSettings;
    this.tokenPromise = aTokenPromise;
}
LogsRetriever.prototype.logsPromise = function(aDate) {
    var date = aDate || new Date();
    var domain = this.connectionSettings.DOMAIN;
    return (this.tokenPromise
        .then(function(aToken) {
            var autenticationToken = aToken.access_token;
            var options = { 
                method: 'GET',
                url: 'https://' + domain + 
                    '/api/v2/logs?q=type%3A%22w%22%20AND%20date%3A%5B' +
                    date.toISOString().substr(0, 10) + 
                    '%20TO%20*%7D%20AND%20description%3AYou%20are%20using%20Auth0%20development%20keys*',
                headers: { 
                    authorization: 'Bearer ' + autenticationToken,
                    'content-type': 'application/json' 
                } 
            };
            return rp(options);
        }))

};

function NotificationProcess(aConnectionSettings, aDate) {
    this.connectionSettings = aConnectionSettings;
    this.date = aDate;
}
NotificationProcess.prototype.run = function() {
    var tokenRetriever = new ManagementAPITokenRetriever(this.connectionSettings);
    var token = tokenRetriever.tokenPromise();
    var logsRetriever = new LogsRetriever(this.connectionSettings, token);
    var logs = logsRetriever.logsPromise(this.date);
    var notificationChannel = {};
    notificationChannel.notify = function(aNotifier) {
        console.log('*NOTIFICATION*\nDescription: '
            + aNotifier.description + '\n'
            + 'Affected clients: ' + 
            Array.from(aNotifier.clients.values()).toString());
    }
    
    logs
    .then(function(aLogsString) {
        var logs = JSON.parse(aLogsString);
        var notifier = new NotifierBuilder().build(logs);
        notifier.notify(notificationChannel);
    })
    .catch(function (error) {
        console.log('An error ocurred while retrieving the logs: ' + error);
    });
};

var webtask = function (context, cb) {
    cb(null, { /*TODO*/ });
}     

webtask.DummyNotifier = DummyNotifier;
webtask.WarningLogsNotifier = WarningLogsNotifier;
webtask.NotifierBuilder = NotifierBuilder;
webtask.ManagementAPITokenRetriever = ManagementAPITokenRetriever;
webtask.LogsRetriever = LogsRetriever;
webtask.NotificationProcess = NotificationProcess;
module.exports = webtask