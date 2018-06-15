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
var toISOString = function toISOString(date, separator) {
    var year = date.getFullYear();
    var m = date.getMonth();
    var month = Number(m + 1) < 10 ? '0' + (m + 1) : m + 1 + '';
    var d = date.getDate();
    var dd = Number(d) < 10 ? '0' + d : d;

    return year + separator + month + separator + dd;
};

var toISOTimeString = function toISOTimeString(date, separator, tSeparator) {
    var year = date.getFullYear();
    var m = date.getMonth();
    var month = Number(m + 1) < 10 ? '0' + (m + 1) : m + 1 + '';
    var d = date.getDate();
    var dd = Number(d) < 10 ? '0' + d : d;

    var h = date.getHours();
    var mi = date.getMinutes();

    var hour = Number(h) < 10 ? '0' + h : h + '';
    var minute = Number(m) < 10 ? '0' + m : m + '';
    return year + separator + month + separator + dd + tSeparator + hour + ':' + minute;
};

var toOracleISOTimeString = function toOracleISOTimeString(date) {
    var year = date.getFullYear();
    var m = date.getMonth();
    var month = Number(m + 1) < 10 ? '0' + (m + 1) : m + 1 + '';
    var d = date.getDate();
    var dd = Number(d) < 10 ? '0' + d : d;

    var h = date.getHours();
    var mi = date.getMinutes();

    var hour = Number(h) < 10 ? '0' + h : h + '';
    var minute = Number(m) < 10 ? '0' + m : m + '';
    return year + '' + month + '' + dd + '' + hour + '' + minute;
};
module.exports = {
    defaultPromiseErrorHandler: defaultPromiseErrorHandler,
    getExceptKeyObject: getExceptKeyObject,
    addPrefixErrorHandler: addPrefixErrorHandler,
    toISOString: toISOString,
    toISOTimeString: toISOTimeString,
    toOracleISOTimeString: toOracleISOTimeString
};
//# sourceMappingURL=commonUtil.js.map