'use strict';

var crypto = require('crypto');

var genRandomString = function genRandomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex') /** convert to hexadecimal format */
    .slice(0, length); /** return required number of characters */
};

var sha512 = function sha512(password, salt) {
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
};

var makePassword = function makePassword(plainPassword) {
    var salt = genRandomString(16);
    return sha512(plainPassword, salt);
};
var checkPassword = function checkPassword(plainPassword, salt, realPassword) {
    return sha512(plainPassword, salt) === realPassword;
};

module.exports = {
    makePassword: makePassword,
    checkPassword: checkPassword
};
//# sourceMappingURL=passwordUtil.js.map