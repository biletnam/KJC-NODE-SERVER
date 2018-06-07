const express = require('express');
const router = express.Router();
const Joi = require('joi');
const multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var path = process.cwd();
var envModule = require( path + '/envModule' );
const jwt = require('jsonwebtoken');
const customerService = require('./oraclDBService/customerService');
const passwordUtil = require('../commonModule/passwordUtil');
const loginUtil = require('../commonModule/loginUtil');
const commonUtil = require('../commonModule/commonUtil');

const defaultErrorHandler = commonUtil.defaultPromiseErrorHandler;
router.get('/', (req, res) => {
    const result = customerService.findCustomers();
    result.then((data) => {
        res.send(data);
    })
})
router.post('/user', (req,res) => {
    const {error} = validateUser(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }

    const name = req.body.name;
    const id = req.body.id;
    const password = req.body.password;
    const email = req.body.email;
    const birth = req.body.birth;
    const phone = req.body.phone;
    const zipCode = req.body.zipCode;
    const address = req.body.address;
    const address_detail = req.body.addressDetail;

    const passwordObject = passwordUtil.makePassword(password);
    const salt = passwordObject.salt;
    const realPassword = passwordObject.passwordHash;
    console.log(passwordObject);
    const makeObject = {
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
    }
    customerService.registerUser(makeObject)
        .then((data) => res.send(data));
/*    const result  = customerService.registerPeople();
    result.then((data) => {
        res.send(data);
    })*/
})

router.get('/user/:id/check',(req,res) => {
    const id = req.params.id;
    console.log(id);
    customerService.userIdCheck(id).then((row) => {
        console.log(row);
        if(row.length > 0 ) {
            res.send(true);
        }else {
            res.send(false);
        }
    })
});
router.get('/user/:id', (req,res) => {
    const id = req.params.id;
    customerService
        .findUserById(id)
        .then((data) => {res.send(data)});
});
router.post('/user/login', (req, res) => {
        const body = req.body;
        if(!body || !body.id || !body.password) {
            res.status(405).send('Bad Request');
            return;
        }
        customerService.findUserById(body.id)
            .then((data) => {
                if(data.length === 0) {
                    res.status(404).send('there is no User of this ID');
                    return;
                }
                const user = data[0];
                console.log(user);
                const result = passwordUtil.checkPassword(body.password, user.SALT, user.PASSWORD);
                if(result) {
                    loginUtil
                        .getToken(user)
                        .then((token) => {
                            res.send({token: token, message: 'loginSuccess'});
                        })
                        .catch(defaultErrorHandler);
                }else {
                    res.send(400).send('로그인에 실패했습니다.')
                }
            }).catch(defaultErrorHandler);
    }
)

function validateUser(user) {
    const scheme = {
        name: Joi.string().min(3).required(),
        id: Joi.string().min(1),
        password: Joi.string().min(1).required(),
        zipCode: Joi.string().min(1).required(),
        email: Joi.string().min(1).required(),
        birth: Joi.string().min(5).required(),
        phone: Joi.string().min(1).required(),
        address: Joi.string().min(1).required(),
        address_detail:Joi.string().min(1).required(),
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(user,scheme);
}
module.exports = router;