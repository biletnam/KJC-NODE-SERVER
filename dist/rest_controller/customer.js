'use strict';

var express = require('express');
var router = express.Router();
var Joi = require('joi');
var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var path = process.cwd();
var envModule = require(path + '/envModule');
var jwt = require('jsonwebtoken');
var customerService = require('./oraclDBService/customerService');
var passwordUtil = require('../commonModule/passwordUtil');
var loginUtil = require('../commonModule/loginUtil');
var commonUtil = require('../commonModule/commonUtil');

var defaultErrorHandler = commonUtil.defaultPromiseErrorHandler;
router.get('/', function (req, res) {
    var result = customerService.findCustomers();
    result.then(function (data) {
        res.send(data);
    });
});
router.post('/user', function (req, res) {
    var _validateUser = validateUser(req.body),
        error = _validateUser.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }

    var name = req.body.name;
    var id = req.body.id;
    var password = req.body.password;
    var email = req.body.email;
    var birth = req.body.birth;
    var phone = req.body.phone;
    var zipCode = req.body.zipCode;
    var address = req.body.address;
    var address_detail = req.body.addressDetail;

    var passwordObject = passwordUtil.makePassword(password);
    var salt = passwordObject.salt;
    var realPassword = passwordObject.passwordHash;
    console.log(passwordObject);
    var makeObject = {
        IS_USER: 'Y',
        PHONE: phone,
        USER_NAME: name,
        USER_ID: id,
        ZIP_CODE: zipCode,
        ADDR: address,
        ADDR_DET: address_detail,
        BIRTH: birth,
        PASSWORD: realPassword,
        SALT: salt,
        EMAIL: email
    };
    customerService.registerUser(makeObject).then(function (data) {
        return res.send(data);
    });
    /*    const result  = customerService.registerPeople();
        result.then((data) => {
            res.send(data);
        })*/
});

router.get('/user/:id/check', function (req, res) {
    var id = req.params.id;
    console.log(id);
    customerService.userIdCheck(id).then(function (row) {
        console.log(row);
        if (row.length > 0) {
            res.send(true);
        } else {
            res.send(false);
        }
    });
});
router.get('/user/:id', function (req, res) {
    var id = req.params.id;
    customerService.findUserById(id).then(function (data) {
        res.send(data);
    });
});
router.post('/user/login', function (req, res) {
    var body = req.body;
    if (!body || !body.id || !body.password) {
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
            }).catch(defaultErrorHandler);
        } else {
            res.send(400).send('로그인에 실패했습니다.');
        }
    }).catch(defaultErrorHandler);
});

function validateUser(user) {
    var scheme = {
        name: Joi.string().min(3).required(),
        id: Joi.string().min(1),
        password: Joi.string().min(1).required(),
        zipCode: Joi.string().min(1).required(),
        email: Joi.string().min(1).required(),
        birth: Joi.string().min(5).required(),
        phone: Joi.string().min(1).required(),
        address: Joi.string().min(1).required(),
        address_detail: Joi.string().min(1).required()
        //		minAge: Joi.number().required(),
    };return Joi.validate(user, scheme);
}
module.exports = router;
//# sourceMappingURL=customer.js.map