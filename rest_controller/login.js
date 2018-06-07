const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const customerService = require('./oraclDBService/customerService');
const passwordUtil = require('../commonModule/passwordUtil');
const loginUtil = require('../commonModule/loginUtil');
const commonUtil = require('../commonModule/commonUtil');

router.get('/check', (req, res) => {
    const token = req.headers['x-access-token'] || req.query.token
    // token does not exist
    if(!token) {
        return res.status(403).json({
            success: false,
            message: 'not logged in'
        })
    }

    // create a promise that decodes the token
    const p = new Promise(
        (resolve, reject) => {
            jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => {
                console.log(decoded);
                if(err) reject(err);
                resolve(decoded)
            })
        }
    )

    // if token is valid, it will respond with its info
    const respond = (token) => {
        res.json({
            success: true,
            info: {
                id: token._id,
                name: token.username
            }
        })
    }

    // if it has failed to verify, it will return an error message
    const onError = (error) => {
        res.status(403).json({
            success: false,
            message: error.message
        })
    }

    // process the promise
    p.then(respond).catch(onError)
});

router.post('/', (req, res) => {
        const body = req.body;
        if(!body || !body.id || !body.password) {
            console.log('login bad request');
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
                        .catch(commonUtil.defaultPromiseErrorHandler);
                }else {
                    res.status(400).send('로그인에 실패했습니다.')
                }
            }).catch(commonUtil.defaultPromiseErrorHandler);
    }
);
const tokenRespondForNonUser = (req, res, customer) => {
    loginUtil.getTokenForNonUser(customer)
        .then((token) => {
            res.send({token: token, message: 'loginSuccess'}); // here send token
        }).catch(commonUtil.defaultPromiseErrorHandler);
}
const registerNonUserCustomerAndLoginRespond = (req, res) => {
    customerService.registerNonUser({USER_NAME: req.body.name, PHONE: req.body.phone})
        .then((nonUserObject) => {
            customerService.findCustomerByNameAndPhone(nonUserObject.USER_NAME, nonUserObject.PHONE)
                .then((data) => {
                    if(data.length > 0) {
                        tokenRespondForNonUser(req,res, data[0]);
                    }
                }).catch(commonUtil.defaultPromiseErrorHandler);
        }).catch(commonUtil.defaultPromiseErrorHandler);
}
router.post('/nonUser', (req,res) => {
    const body = req.body;
    if(!body || !body.name || !body.phone) {
        console.log('login bad request');
        res.status(405).send('Bad Request');
        return;
    }
    let customer;
    customerService.findCustomerByNameAndPhone(body.name, body.phone).then((data) => {
        if(data.length > 0) {
            customer = data[0];
            if(customer.IS_USER === 'Y'){
                res.status(405).send('이미 회원가입이 돼있는 회원입니다.');
            }else {
                tokenRespondForNonUser(req,res, customer);
                return;
            }
        }else {
            registerNonUserCustomerAndLoginRespond(req,res);
            return;
        }
    }).catch(commonUtil.defaultPromiseErrorHandler);
})
const removeImportantData = (userInformation) => {
    const important = ['CUST_ID', 'SALT', 'PASSWORD'];
    important.map((key) => {
        delete userInformation[key];
    });
    return userInformation;
}
router.get('/info', (req,res) => {
    console.log('get Info Request');
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            if(!decoded.isUser) {
                res.status(405).send('this customer is not user');
            }
            const CUST_ID = decoded._c_id;
            customerService.findUserByCustomerId(CUST_ID)
                .then((data) => {
                    if(!data || data.length === 0 ) {
                      res.status(400).send('no User Information');
                      return;
                    }
                    const userInformation = data[0];
                    res.send(removeImportantData(userInformation))
                }).catch(commonUtil.defaultPromiseErrorHandler);
        }).catch(commonUtil.defaultPromiseErrorHandler);
})

module.exports = router;