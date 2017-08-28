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

var webtask = function (context, cb) {
    cb(null, { /*TODO*/ });
}     

webtask.DummyNotifier = DummyNotifier;
webtask.WarningLogsNotifier = WarningLogsNotifier;
webtask.NotifierBuilder = NotifierBuilder;
module.exports = webtask