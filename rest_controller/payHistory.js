const express = require('express');
const router = express.Router();
const Joi = require('joi');
const ticketService = require('./oraclDBService/ticketService');
const customerService = require('./oraclDBService/customerService');
const discountService = require('./oraclDBService/discountService');
const commonUtil = require('../commonModule/commonUtil');
const loginUtil = require('../commonModule/loginUtil');
const payHistoryService = require('./oraclDBService/payHistoryService');

router.post('/', (req, res) => {
    const {error} = validatePayHistory(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            const CUST_ID = decoded._c_id;
            if(decoded.isUser) {
                userPay(req,res,CUST_ID);
            } else {
                nonUserPay(req,res,CUST_ID);
            }
        }).catch((error) => {res.status(403).send('login required')});
})
router.get('/of', (req,res) => {
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            const CUST_ID = decoded._c_id;
            payHistoryService.findPayHistoryByCustomerId(CUST_ID)
                .then((data) => res.send(data))
                .catch((error) => res.status(500).send(error));
        }).catch((error) => {res.status(403).send('login required')});
})
function userPay(req, res, CUST_ID) {
    return customerService.findUserByCustomerId(CUST_ID)
        .then((data) => {
            const point = data[0].PIONT;
            if(point < Number(req.body.POINT_PAY)) {
                throw 'point is lower';
            }
            return ticketService.findTicketById(req.body.TCK_ID);
        }).then((data) => {
            return new Promise((resolve,reject) => {
                const payTicket = data[0];
                console.log(payTicket);
                if(!payTicket) {
                    reject('no ticket');
                    return;
                }
                const pointSave = Math.floor(payTicket.TCK_PRICE / 10);
                const payPrice = payTicket.TCK_PRICE - Number(req.body.POINT_PAY);
                const payHistoryObject = {
                    CUST_ID: CUST_ID, PAY_DET_CODE: Number(req.body.PAY_DET_CODE),
                    PAY_CL_CODE: Number(req.body.PAY_CL_CODE), POINT_PAY: req.body.POINT_PAY, DISC_PRICE: 0,
                    PAY_PRICE: payPrice, POINT_SAVE: pointSave, TCK_ID: payTicket.TCK_ID,
                    DISC_CODE: null
                }

                if(req.body.DISC_CODE) {
                    discountService.findByCode(req.body.DISC_CODE)
                        .then((discData) => {
                            const disc = discData[0];
                            if(!disc) {
                                reject('no Discount');
                                return;
                            }
                            payHistoryObject.DISC_PRICE = discountService.calculateDiscountPrice(payTicket.TCK_PRICE, disc.DISC_METHOD, disc.DISC_AMT);
                            payHistoryObject.PAY_PRICE = payTicket.TCK_PRICE - Number(payHistoryObject.DISC_PRICE) - Number(payHistoryObject.POINT_PAY);
                            payHistoryObject.DISC_CODE = disc.DISC_CODE;
                            resolve(payHistoryObject);
                        })
                        .catch((error) => {reject(error)});
                } else {
                    resolve(payHistoryObject);
                }
            })
        }).then((payHistoryObject) => {
            console.log(payHistoryObject);
            return payHistoryService.createPayHistory(payHistoryObject);
        }).then((result) => res.send(result))
        .catch((error) => res.status(500).send(error));
}
function nonUserPay(req, res, CUST_ID) {
    return customerService.findNonUserCustomerByCustomerId(CUST_ID)
        .then((result) => {
            return ticketService.findTicketById(req.body.TCK_ID);
        }).then((data) => {
            return new Promise((resolve,reject) => {
                const payTicket = data[0];
                if(!payTicket) {
                    reject('no ticket');
                    return;
                }
                const payPrice = payTicket.TCK_PRICE - Number(req.body.POINT_PAY);
                const payHistoryObject = {
                    CUST_ID: CUST_ID, PAY_DET_CODE: Number(req.body.PAY_DET_CODE),
                    PAY_CL_CODE: Number(req.body.PAY_CL_CODE), POINT_PAY: 0, DISC_PRICE: 0,
                    PAY_PRICE: payPrice, POINT_SAVE: 0, TCK_ID: payTicket.TCK_ID,
                    DISC_CODE: null
                }

                if(req.body.DISC_CODE) {
                    discountService.findByCode(req.body.DISC_CODE)
                        .then((discData) => {
                            const disc = discData[0];
                            if(!disc) {
                                reject('no Discount');
                                return;
                            }
                            payHistoryObject.DISC_PRICE = discountService.calculateDiscountPrice(payTicket.TCK_PRICE, disc.DISC_METHOD, disc.DISC_AMT);
                            payHistoryObject.PAY_PRICE = payTicket.TCK_PRICE - Number(payHistoryObject.DISC_PRICE) - Number(payHistoryObject.POINT_PAY);
                            payHistoryObject.DISC_CODE = disc.DISC_CODE;
                            resolve(payHistoryObject);
                        })
                        .catch((error) => {reject(error)});
                } else {
                    resolve(payHistoryObject);
                }
            })
        }).then((payHistoryObject) => {
            console.log(payHistoryObject);
            return payHistoryService.createPayHistoryOfNonUser(payHistoryObject);
        }).then((result) => res.send(result))
        .catch((error) => res.status(500).send(error));
}


function validatePayHistory(playHistoryObject) {
    const scheme = {
        TCK_ID: Joi.number().required(),
        PAY_DET_CODE: Joi.number().required(),
        PAY_CL_CODE: Joi.number().required(),
        DISC_CODE: Joi.number(),
        POINT_PAY: Joi.number()
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(playHistoryObject,scheme);
}

module.exports = router;