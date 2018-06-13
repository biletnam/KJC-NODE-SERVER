'use strict';

var express = require('express');
var router = express.Router();
var seatTypeService = require('../oraclDBService/price/seatTypeService');
var Joi = require('joi');

router.get('/', function (req, res) {
    seatTypeService.findSeatTypeAll().then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        return res.status(400).send('find seat type');
    });
});

router.post('/', function (req, res) {
    console.log(req.body);

    var _validateSeatType = validateSeatType(req.body),
        error = _validateSeatType.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    var seatTypeObject = {
        SEAT_TYPE_NAME: req.body.name,
        ADD_COST: req.body.price
    };
    seatTypeService.insertSeatType(seatTypeObject).then(function (result) {
        res.send('success');
    }).catch(function (error) {
        return console.log(error);
    });
});

function validateSeatType(seatType) {
    var scheme = {
        name: Joi.string().min(1).required(),
        price: Joi.number().min(0).required()
        //		minAge: Joi.number().required(),
    };return Joi.validate(seatType, scheme);
}

module.exports = router;
//# sourceMappingURL=seatType.js.map