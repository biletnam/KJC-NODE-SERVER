'use strict';

var defaultPromiseErrorHandler = function defaultPromiseErrorHandler(error) {
    console.log(error);
};
var addPrefixErrorHandler = function addPrefixErrorHandler(error, prefix) {
    console.log(error);
    console.log(prefix + ' ', error);
};
var getExceptKeyObject = function getExceptKeyObject(object, exceptKeyArray) {
    var wrapping = {};
    Object.keys(object).map(function (key) {
        if (exceptKeyArray.indexOf(key) === -1) {
            wrapping[key] = object[key];
        }
    });
    return wrapping;
};

module.exports = {
    defaultPromiseErrorHandler: defaultPromiseErrorHandler,
    getExceptKeyObject: getExceptKeyObject,
    addPrefixErrorHandler: addPrefixErrorHandler
};
//# sourceMappingURL=commonUtil.js.map