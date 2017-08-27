function DummyNotifier(logs) {};
DummyNotifier.prototype.notify = function(notificationChannel) {/*Does nothing*/};

var webtask = function (context, cb) {
    cb(null, { /*TODO*/ });
}     

webtask.DummyNotifier = DummyNotifier;
module.exports = webtask