'use strict';

var express = require('express');
var router = express.Router();
var seatService = require('./oraclDBService/seatService');
var Joi = require('joi');

router.get('/:CINEMA_NO/:BRCH_ID', function (req, res) {
    var BRCH_ID = req.params.BRCH_ID;
    var CINEMA_NO = req.params.CINEMA_NO;

    if (!BRCH_ID || !CINEMA_NO) {
        res.status(405).send('check Branch ID or cinema NO');
        return;
    }

    seatService.findSeatsByCinemaNoAndBranchID(CINEMA_NO, BRCH_ID).then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        console.log(error);res.status(404).send('not found');
    });
});

router.put('/seatType', function (req, res) {
    var _validateSeatUpdate = validateSeatUpdate(req.body),
        error = _validateSeatUpdate.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    var cinemaNumber = req.body.cinemaNumber;
    var branchId = req.body.branchId;
    var seatTypeId = req.body.seatTypeId;
    var seatObject = req.body.selectedSeatNames.map(function (seatName) {
        return {
            SEAT_TYPE_ID: seatTypeId,
            BRCH_ID: branchId,
            CINEMA_NO: cinemaNumber,
            SEAT_NAME: seatName
        };
    });
    console.log(seatObject);
    seatService.updateSeatsSeatType(seatObject).then(function (result) {
        return res.send('success');
    }).catch(function (error) {
        return res.status(400).send(error);
    });
});
function validateSeatUpdate(seatUpdate) {
    var scheme = {
        cinemaNumber: Joi.number().required(),
        branchId: Joi.number().required(),
        seatTypeId: Joi.number().required(),
        selectedSeatNames: Joi.array().required()
        //		minAge: Joi.number().required(),
    };return Joi.validate(seatUpdate, scheme);
}
module.exports = router;
//# sourceMappingURL=seats.js.map