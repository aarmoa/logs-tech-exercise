var assert = require('chai').assert;
var webtask = require('../logsCheck.js');
var DummyNotifier = webtask.DummyNotifier;
var WarningLogsNotifier = webtask.WarningLogsNotifier;
var NotifierBuilder = webtask.NotifierBuilder;

var notificationChannel = {
    notificationExecuted:false};
notificationChannel.notify = function(notifier) {
    this.notificationExecuted = true;
}

function createExampleLog(aClientID) {
    return {
        date:"2017-08-26T19:15:30.384Z",
        type:"w",
        description: "You are using Auth0 development keys which are only intended for use in development and testing. This connection (google-oauth2) should be configured with your own Development Keys to enable the consent page to show your logo instead of Auth0's and to enable SSO for this connection. AUTH0 DEVELOPMENT KEYS ARE NOT RECOMMENDED FOR PRODUCTION ENVIRONMENTS. To learn more about Development Keys please refer to https://auth0.com/docs/connections/social/devkeys.",
        connection: "google-oauth2",
        connection_id: "con_pJfjltsflswRVKyn",
        client_id: aClientID,
        ip: "181.31.75.165",
        user_agent: "Chromium 60.0.3112 / Ubuntu 0.0.0",
        user_id: "",
        user_name: "",
        strategy: "google-oauth2",
        strategy_type: "social",
        _id: "49574419589858254662355516680765660057982804740905369634",
        log_id: "49574419589858254662355516680765660057982804740905369634",
        isMobile: false
      }
}

describe('Logs parser', function() {
    beforeEach(function() {
        notificationChannel.notificationExecuted = false;
    });

    describe('DummyNotifier', function() {
        it('should notify nothing', function() {
            var notifier = new DummyNotifier([]);
            notifier.notify(notificationChannel);
            assert(notificationChannel.notificationExecuted === false)
        })
    });

    describe('WarningLogsNotifier', function() {
        it('should notify through the notification channel', function() {
            var logs = [createExampleLog("KhkNXbvwuYmfFGdvkRrmGLoc4SuTPcMI")];
            var notifier = new WarningLogsNotifier(logs);
            notifier.notify(notificationChannel);
            assert(notificationChannel.notificationExecuted)
        });
        it('A notifier created for one log should have a description and the affected clients',
            function() {
                var logs = [createExampleLog("KhkNXbvwuYmfFGdvkRrmGLoc4SuTPcMI")];
                var notifier = new WarningLogsNotifier(logs);
                assert(notifier.description === logs[0].description);
                assert(notifier.clients.has(logs[0].client_id));
        })
        it('A notifier created with two logs from the same client should have one client',
            function() {
                var logs = [createExampleLog("KhkNXbvwuYmfFGdvkRrmGLoc4SuTPcMI"),
                    createExampleLog("KhkNXbvwuYmfFGdvkRrmGLoc4SuTPcMI")];
                var notifier = new WarningLogsNotifier(logs);
                assert(notifier.clients.size === 1);
            });
        it('A notifier created with two logs from the different clients should have one client',
            function() {
                var logs = [createExampleLog("client1"),
                    createExampleLog("client2")];
                var notifier = new WarningLogsNotifier(logs);
                assert(notifier.clients.size === 2);
                assert(notifier.clients.has(logs[0].client_id));
                assert(notifier.clients.has(logs[1].client_id));
            });
    });

    describe('NotifierBuilder', function() {
        beforeEach(function() {
            notificationChannel.notificationExecuted = false;
        });

        it('Should create a DummyNotifier when there are no logs', function() {
            var builder = new NotifierBuilder();
            var notifier = builder.build([]);
            notifier.notify(notificationChannel);
            assert(notificationChannel.notificationExecuted === false)
        });
        it('Should create a WarningLogsNotifier when there are logs', function() {
            var logs = [createExampleLog("KhkNXbvwuYmfFGdvkRrmGLoc4SuTPcMI")];
            var builder = new NotifierBuilder();
            var notifier = builder.build(logs);
            notifier.notify(notificationChannel);
            assert(notificationChannel.notificationExecuted)
        });
    });
});
 