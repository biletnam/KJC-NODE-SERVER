const crypto = require('crypto');

var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0,length);   /** return required number of characters */
};

var sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};

const makePassword = (plainPassword) => {
    const salt = genRandomString(16);
    return sha512(plainPassword, salt);
}
const checkPassword = (plainPassword, salt, realPassword) => {
    return sha512(plainPassword, salt).passwordHash === realPassword;
}

module.exports = {
    makePassword: makePassword,
    checkPassword: checkPassword
}