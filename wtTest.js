var hello = function() {
    return 'Hello world'
}

var salutation = function (cb) {
    cb(null, hello() + salutation.hello);
}

salutation.hello = hello;

module.exports = salutation