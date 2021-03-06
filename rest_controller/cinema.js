const express = require('express');
const router = express.Router();
const Joi = require('joi');
const cinemaService = require('./oraclDBService/cinemaService');
const commonUtil = require('../commonModule/commonUtil');
const loginUtil = require('../commonModule/loginUtil');
router.get('/', (req,res) => {
    cinemaService.findAll()
        .then((data) => {
            res.send(data);
        })
        .catch((error) => {console.log(error); res.status(404).send('not found');});
})
router.post('/', (req,res) => {
    const {error} = validateCinema(req.body);
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
            const cinemaObject = {
                CINEMA_NO: req.body.cinemaNumber,
                BRCH_ID: req.body.branch,
                SEAT_TYPE_ID: req.body.seatType,
                FLOOR: req.body.floor,
                rows: req.body.rows
            }
            cinemaService.insertCinema(cinemaObject)
                .then((r) => res.send('success'))
                .catch((error) => res.status(500).send(error));
        }).catch((error) => res.status(403).send(error))
});

function validateCinema(cinema) {
    const scheme = {
        cinemaNumber: Joi.number().min(0).required(),
        rows: Joi.array(),
        branch: Joi.number().required(),
        floor: Joi.number().required(),
        seatType: Joi.number().required()
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(cinema,scheme);
}

module.exports = router;