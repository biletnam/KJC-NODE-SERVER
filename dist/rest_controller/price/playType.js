'use strict';

var express = require('express');
var router = express.Router();
var playTypeService = require('../oraclDBService/price/playTypeService');
var Joi = require('joi');

router.get('/', function (req, res) {
    playTypeService.findPlayTypeAll().then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        return res.status(400).send('find seat type');
    });
});

router.post('/', function (req, res) {
    var _validatePlayType = validatePlayType(req.body),
        error = _validatePlayType.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    var playTypeObject = {
        PT_NAME: req.body.name,
        PT_PRICE: req.body.price
    };
    playTypeService.insertPlayType(playTypeObject).then(function (result) {
        res.send('success');
    }).catch(function (error) {
        return console.log(error);
    });
});

function validatePlayType(playType) {
    var scheme = {
        name: Joi.string().min(1).required(),
        price: Joi.number().min(0).required()
        //		minAge: Joi.number().required(),
    };return Joi.validate(playType, scheme);
}

module.exports = router;
//# sourceMappingURL=playType.js.map