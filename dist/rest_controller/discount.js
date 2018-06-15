'use strict';

var express = require('express');
var router = express.Router();
var Joi = require('joi');
var discountService = require('./oraclDBService/discountService');
var loginUtil = require('../commonModule/loginUtil');
router.get('/', function (req, res) {
    discountService.findAll().then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        return res.status(500).send(error);
    });
});
router.post('/', function (req, res) {
    var _validateDiscount = validateDiscount(req.body),
        error = _validateDiscount.error;

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
        var discountObject = { DISC_NAME: req.body.name, DISC_METHOD: req.body.discountMethod,
            DISC_AMT: req.body.discountAmount };

        discountService.insertDiscount(discountObject).then(function (data) {
            return res.send(data);
        }).catch(function (error) {
            return res.status(500).send(error);
        });
    }).catch(function (error) {
        return res.status(403).send(error);
    });
});

function validateDiscount(discount) {
    var scheme = {
        name: Joi.string().min(1).required(),
        discountMethod: Joi.string().required(),
        discountAmount: Joi.number().required()
    };
    return Joi.validate(discount, scheme);
}

module.exports = router;
//# sourceMappingURL=discount.js.map