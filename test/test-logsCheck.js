var assert = require('chai').assert;
var webtask = require('../logsCheck.js');
var DummyNotifier = webtask.DummyNotifier;

var notificationChannel = {
    notificationExecuted:false};
notificationChannel.notify = function(notifier) {
    this.notificationExecuted = true;
}

describe('Logs parser', function() {
    describe('Dummy notifier', function() {
        it('should notify nothing', function() {
            var notifier = new DummyNotifier([]);
            notifier.notify(notificationChannel);
            assert(notificationChannel.notificationExecuted === false)
        })
    })
})
 