'use strict';

var jwt = require('jsonwebtoken');
var secret = require('../config/oracle-db-config').secret;

var getToken = function getToken(userData) {
    var p = new Promise(function (resolve, reject) {
        var isDIrector = userData.IS_USER === 'D' ? true : false;
        jwt.sign({
            _id: userData.USER_ID,
            username: userData.USER_NAME,
            _c_id: userData.CUST_ID,
            isUser: true,
            isDirector: isDIrector
        }, secret, {
            expiresIn: '7d',
            issuer: 'localhost'
        }, function (err, token) {
            if (err) reject(err);
            resolve(token);
        });
    });
    return p;
};
var getTokenForNonUser = function getTokenForNonUser(nonUserData) {
    var p = new Promise(function (resolve, reject) {
        jwt.sign({
            username: nonUserData.USER_NAME,
            phone: nonUserData.PHONE,
            _c_id: nonUserData.CUST_ID,
            isUser: false
        }, secret, {
            expiresIn: '7d',
            issuer: 'localhost'
        }, function (err, token) {
            if (err) reject(err);
            resolve(token);
        });
    });
    return p;
};
var tokenCheckPromise = function tokenCheckPromise(req) {
    var token = req.headers['x-access-token'] || req.query.token;

    // create a promise that decodes the token
    var p = new Promise(function (resolve, reject) {
        if (!token) {
            reject(false);
        }
        jwt.verify(token, req.app.get('jwt-secret'), function (err, decoded) {
            if (err) reject(err);
            resolve(decoded);
        });
    });
    // process the promise
    return p;
};
module.exports = {
    getToken: getToken,
    tokenCheckPromise: tokenCheckPromise,
    getTokenForNonUser: getTokenForNonUser
};
//# sourceMappingURL=loginUtil.js.map