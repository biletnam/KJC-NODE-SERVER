const express = require('express');
const router = express.Router();
const Joi = require('joi');
const payMethodService = require('./oraclDBService/payMethodService');
const commonUtil = require('../commonModule/commonUtil');
const loginUtil = require('../commonModule/loginUtil');
router.post('/classify', (req, res) => {
    const {error} = validatePayClassify(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            const isDirector = decoded.isDirector;
            if(!isDirector) {
                res.status(403).send('no Director');
                return;
            }
            const name = req.body.name;
            payMethodService.insertPayClassify(name)
                .then((data) => res.send(data))
                .catch((error) => res.status(500).send(error));
        }).catch((error) => res.status(403).send(error));

});
router.post('/detail', (req, res) => {
    const {error} = validatePayDetail(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            const isDirector = decoded.isDirector;
            if(!isDirector) {
                res.status(403).send('no Director');
                return;
            }
            const detailObject = {PAY_DETAIL_CODE_NAME: req.body.name, PAY_CL_CODE: req.body.payClassifyCode,
                PAY_MODULE_NAME: req.body.moduleName};
            payMethodService.insertPayDetail(detailObject)
                .then((data) => res.send(data))
                .catch((errpr) => res.status(500).send(error));
        }).catch((error) => res.status(403).send(error));
});

router.get('/', (req,res) => {
    payMethodService.findMethod()
        .then((data) => res.send(payMethodWrapper(data)))
        .catch((error) => res.status(500).send(error));
})

function validatePayClassify(classify) {
    const scheme = {
        name: Joi.string().min(1).required()
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(classify,scheme);
}


function validatePayDetail(detail){
    const scheme = {
        name: Joi.string().min(1).required(),
        moduleName: Joi.string().min(1).required(),
        payClassifyCode: Joi.number().required()
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(detail,scheme);
}

function payMethodWrapper(rows) {
    const PAY_METHOD_COLUMN = ['PAY_DET_CODE', 'PAY_DET_CODE_NAME', 'PAY_MODULE_NAME'];
    const object = {};
    rows.map((p) => {
        if(!object[p.PAY_CL_CODE]) {
            object[p.PAY_CL_CODE] = p;
        }
        if(!object[p.PAY_CL_CODE]['PAY_DETAIL']) {
            object[p.PAY_CL_CODE]['PAY_DETAIL'] = [];
        }
        if(p.PAY_CL_CODE) {
            object[p.PAY_CL_CODE]['PAY_DETAIL'].push({
                PAY_DET_CODE: p.PAY_DET_CODE,
                PAY_DET_CODE_NAME: p.PAY_DET_CODE_NAME,
                PAY_MODULE_NAME: p.PAY_MODULE_NAME,
            });
        }
    })
    const exceptObject = Object.keys(object).map((key) => {
        return commonUtil.getExceptKeyObject(object[key], PAY_METHOD_COLUMN);
    })
    return exceptObject;
}
module.exports = router;