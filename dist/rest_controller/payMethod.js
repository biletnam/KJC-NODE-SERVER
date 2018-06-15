'use strict';

var express = require('express');
var router = express.Router();
var Joi = require('joi');
var payMethodService = require('./oraclDBService/payMethodService');
var commonUtil = require('../commonModule/commonUtil');
var loginUtil = require('../commonModule/loginUtil');
router.post('/classify', function (req, res) {
    var _validatePayClassify = validatePayClassify(req.body),
        error = _validatePayClassify.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    loginUtil.tokenCheckPromise(req).then(function (decoded) {
        var isDirector = decoded.isDirector;
        if (!isDirector) {
            res.status(403).send('no Director');
            return;
        }
        var name = req.body.name;
        payMethodService.insertPayClassify(name).then(function (data) {
            return res.send(data);
        }).catch(function (error) {
            return res.status(500).send(error);
        });
    }).catch(function (error) {
        return res.status(403).send(error);
    });
});
router.post('/detail', function (req, res) {
    var _validatePayDetail = validatePayDetail(req.body),
        error = _validatePayDetail.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    loginUtil.tokenCheckPromise(req).then(function (decoded) {
        var isDirector = decoded.isDirector;
        if (!isDirector) {
            res.status(403).send('no Director');
            return;
        }
        var detailObject = { PAY_DETAIL_CODE_NAME: req.body.name, PAY_CL_CODE: req.body.payClassifyCode,
            PAY_MODULE_NAME: req.body.moduleName };
        payMethodService.insertPayDetail(detailObject).then(function (data) {
            return res.send(data);
        }).catch(function (errpr) {
            return res.status(500).send(error);
        });
    }).catch(function (error) {
        return res.status(403).send(error);
    });
});

router.get('/', function (req, res) {
    payMethodService.findMethod().then(function (data) {
        return res.send(payMethodWrapper(data));
    }).catch(function (error) {
        return res.status(500).send(error);
    });
});

function validatePayClassify(classify) {
    var scheme = {
        name: Joi.string().min(1).required()
        //		minAge: Joi.number().required(),
    };return Joi.validate(classify, scheme);
}

function validatePayDetail(detail) {
    var scheme = {
        name: Joi.string().min(1).required(),
        moduleName: Joi.string().min(1).required(),
        payClassifyCode: Joi.number().required()
        //		minAge: Joi.number().required(),
    };return Joi.validate(detail, scheme);
}

function payMethodWrapper(rows) {
    var PAY_METHOD_COLUMN = ['PAY_DET_CODE', 'PAY_DET_CODE_NAME', 'PAY_MODULE_NAME'];
    var object = {};
    rows.map(function (p) {
        if (!object[p.PAY_CL_CODE]) {
            object[p.PAY_CL_CODE] = p;
        }
        if (!object[p.PAY_CL_CODE]['PAY_DETAIL']) {
            object[p.PAY_CL_CODE]['PAY_DETAIL'] = [];
        }
        if (p.PAY_CL_CODE) {
            object[p.PAY_CL_CODE]['PAY_DETAIL'].push({
                PAY_DET_CODE: p.PAY_DET_CODE,
                PAY_DET_CODE_NAME: p.PAY_DET_CODE_NAME,
                PAY_MODULE_NAME: p.PAY_MODULE_NAME
            });
        }
    });
    var exceptObject = Object.keys(object).map(function (key) {
        return commonUtil.getExceptKeyObject(object[key], PAY_METHOD_COLUMN);
    });
    return exceptObject;
}
module.exports = router;
//# sourceMappingURL=payMethod.js.map