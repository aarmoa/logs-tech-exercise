const rp = require('request-promise');
const nodemailer = require('nodemailer');

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

function ConsoleNotificationChannel() {};
ConsoleNotificationChannel.prototype.notify = function(aNotifier) {
    console.log('*NOTIFICATION*\nDescription: '
        + aNotifier.description + '\n'
        + 'Affected clients: ' + 
        Array.from(aNotifier.clients.values()).toString());
}

function EmailNotificationChannel(aSenderAddress, aReceiverAddress, aSubject) {
    this.sender = aSenderAddress;
    this.receiver = aReceiverAddress;
    this.subject = aSubject;
};
EmailNotificationChannel.prototype.mailBody = function(aNotifier) {
    var body = 'Dear Auth0 user:<br><br> '
        + 'We are sending you this notification because we think there could be a problem '
        + 'in the configuration of some of your clients.<br><br>'
        + aNotifier.description + '<br><br>'
        + 'Affected clients: ' 
        + Array.from(aNotifier.clients.values()).toString();

    return body
}
EmailNotificationChannel.prototype.notify = function(aNotifier) {
    var self = this;

    nodemailer.createTestAccount(function(err, account) {
        var transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: account.user,
                pass: account.pass
            }
        });
        
        var mailOptions = {
            from: self.sender,
            to: self.receiver,
            subject: self.subject,
            html: self.mailBody(aNotifier)
        };
        
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        
        });
    });
        
}

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
    var date = aDate;
    var domain = this.connectionSettings.DOMAIN;
    return (this.tokenPromise
        .then(function(aToken) {
            var autenticationToken = aToken.access_token;
            var options = { 
                method: 'GET',
                url: 'https://' + domain + 
                    '/api/v2/logs?q=type%3A%22w%22%20AND%20date%3A%5B' +
                    date.toISOString() + 
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
    var notificationChannel = 
        new EmailNotificationChannel('support@auth0.com', 
            'receiver@receiver.com', 
            'Possible configuration error in one of your clients');
    
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

function calculateTodayFirstMoment() {
    var now = new Date();
    return new Date(now.getFullYear(), 
                    now.getMonth(), 
                    now.getDate(), 
                    0, 
                    0, 
                    0, 
                    0);
}

var webtask = function (context, cb) {
    var settings = {
        AUDIENCE:context.secrets.AUDIENCE,
        DOMAIN:context.secrets.DOMAIN,
        CLIENT_ID:context.secrets.CLIENT_ID,
        CLIENT_SECRET:context.secrets.CLIENT_SECRET,
        GRANT_TYPE:context.secrets.GRANT_TYPE
    };

    context.storage.get(function (error, data) {
        if (error) return cb(error);
        var todayFirstMoment = calculateTodayFirstMoment().toUTCString();
        data = data || { lastExecutionTime:todayFirstMoment };
        var process = new NotificationProcess(settings, new Date(data.lastExecutionTime));
        process.run();

        data.lastExecutionTime = new Date().toUTCString();

        context.storage.set(data, function (error) {
            if (error) return cb(error);
        });
    
    });
    
    cb(null, { result:'Done'});
}     

webtask.DummyNotifier = DummyNotifier;
webtask.WarningLogsNotifier = WarningLogsNotifier;
webtask.NotifierBuilder = NotifierBuilder;
webtask.ManagementAPITokenRetriever = ManagementAPITokenRetriever;
webtask.LogsRetriever = LogsRetriever;
webtask.NotificationProcess = NotificationProcess;
module.exports = webtask