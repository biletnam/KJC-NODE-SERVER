'use strict';

var express = require('express');
var router = express.Router();
var Joi = require('joi');
var cinemaService = require('./oraclDBService/cinemaService');
var commonUtil = require('../commonModule/commonUtil');
var loginUtil = require('../commonModule/loginUtil');
router.get('/', function (req, res) {
    cinemaService.findAll().then(function (data) {
        res.send(data);
    }).catch(function (error) {
        console.log(error);res.status(404).send('not found');
    });
});
router.post('/', function (req, res) {
    var _validateCinema = validateCinema(req.body),
        error = _validateCinema.error;

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
        var cinemaObject = {
            CINEMA_NO: req.body.cinemaNumber,
            BRCH_ID: req.body.branch,
            SEAT_TYPE_ID: req.body.seatType,
            FLOOR: req.body.floor,
            rows: req.body.rows
        };
        cinemaService.insertCinema(cinemaObject).then(function (r) {
            return res.send('success');
        }).catch(function (error) {
            return res.status(500).send(error);
        });
    }).catch(function (error) {
        return res.status(403).send(error);
    });
});

function validateCinema(cinema) {
    var scheme = {
        cinemaNumber: Joi.number().min(0).required(),
        rows: Joi.array(),
        branch: Joi.number().required(),
        floor: Joi.number().required(),
        seatType: Joi.number().required()
        //		minAge: Joi.number().required(),
    };return Joi.validate(cinema, scheme);
}

module.exports = router;
//# sourceMappingURL=cinema.js.map