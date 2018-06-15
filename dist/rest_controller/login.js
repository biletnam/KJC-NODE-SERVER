'use strict';

var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var customerService = require('./oraclDBService/customerService');
var passwordUtil = require('../commonModule/passwordUtil');
var loginUtil = require('../commonModule/loginUtil');
var commonUtil = require('../commonModule/commonUtil');

router.get('/check', function (req, res) {
    var token = req.headers['x-access-token'] || req.query.token;
    // token does not exist
    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'not logged in'
        });
    }
    console.log(token);

    // create a promise that decodes the token
    var p = new Promise(function (resolve, reject) {
        console.log('here you promise');
        jwt.verify(token, req.app.get('jwt-secret'), function (err, decoded) {
            console.log(decoded);
            if (err) reject(err);
            resolve(decoded);
        });
    });

    // if token is valid, it will respond with its info
    var respond = function respond(token) {
        if (token.isUser) {
            res.json({
                success: true,
                info: {
                    id: token._id,
                    name: token.username
                }
            });
        } else {
            res.json({
                success: true,
                info: {
                    name: token.username
                }
            });
        }
    };

    // if it has failed to verify, it will return an error message
    var onError = function onError(error) {
        res.status(403).json({
            success: false,
            message: error.message
        });
    };

    // process the promise
    p.then(respond).catch(onError);
});

router.post('/', function (req, res) {
    var body = req.body;
    if (!body || !body.id || !body.password) {
        console.log('login bad request');
        res.status(405).send('Bad Request');
        return;
    }
    customerService.findUserById(body.id).then(function (data) {
        if (data.length === 0) {
            res.status(404).send('there is no User of this ID');
            return;
        }
        var user = data[0];
        console.log(user);
        var result = passwordUtil.checkPassword(body.password, user.SALT, user.PASSWORD);
        if (result) {
            loginUtil.getToken(user).then(function (token) {
                res.send({ token: token, message: 'loginSuccess' });
            }).catch(commonUtil.defaultPromiseErrorHandler);
        } else {
            res.status(400).send('로그인에 실패했습니다.');
        }
    }).catch(commonUtil.defaultPromiseErrorHandler);
});
var tokenRespondForNonUser = function tokenRespondForNonUser(req, res, customer) {
    loginUtil.getTokenForNonUser(customer).then(function (token) {
        res.send({ token: token, message: 'loginSuccess' }); // here send token
    }).catch(commonUtil.defaultPromiseErrorHandler);
};
var registerNonUserCustomerAndLoginRespond = function registerNonUserCustomerAndLoginRespond(req, res) {
    customerService.registerNonUser({ USER_NAME: req.body.name, PHONE: req.body.phone }).then(function (nonUserObject) {
        return customerService.findNonUserCustomerByNameAndPhone(nonUserObject.USER_NAME, nonUserObject.PHONE).then(function (data) {
            if (data.length > 0) {
                tokenRespondForNonUser(req, res, data[0]);
            } else {
                res.status(500).send('error');
            }
        });
    }).catch(commonUtil.defaultPromiseErrorHandler);
};
router.post('/nonUser', function (req, res) {
    var body = req.body;
    if (!body || !body.name || !body.phone) {
        console.log('login bad request');
        res.status(405).send('Bad Request');
        return;
    }
    var customer = void 0;
    console.log(req.body.name, req.body.phone);
    customerService.findNonUserCustomerByNameAndPhone(body.name, body.phone).then(function (data) {
        if (data.length > 0) {
            customer = data[0];
            tokenRespondForNonUser(req, res, customer);
            return;
        } else {
            registerNonUserCustomerAndLoginRespond(req, res);
            return;
        }
    }).catch(commonUtil.defaultPromiseErrorHandler);
});
var removeImportantData = function removeImportantData(userInformation) {
    var important = ['CUST_ID', 'SALT', 'PASSWORD'];
    important.map(function (key) {
        delete userInformation[key];
    });
    return userInformation;
};
router.get('/info', function (req, res) {
    console.log('get Info Request');
    loginUtil.tokenCheckPromise(req).then(function (decoded) {
        if (!decoded.isUser) {
            console.log('non User here');
            res.send({ IS_USER: 'N' });
            return;
        }
        var CUST_ID = decoded._c_id;
        customerService.findUserByCustomerId(CUST_ID).then(function (data) {
            if (!data || data.length === 0) {
                res.status(400).send('no User Information');
                return;
            }
            var userInformation = data[0];
            res.send(removeImportantData(userInformation));
        }).catch(commonUtil.defaultPromiseErrorHandler);
    }).catch(commonUtil.defaultPromiseErrorHandler);
});

module.exports = router;
//# sourceMappingURL=login.js.map