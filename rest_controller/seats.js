const express = require('express');
const router = express.Router();
const seatService = require('./oraclDBService/seatService');
const Joi = require('joi');

router.get('/:CINEMA_NO/:BRCH_ID', (req,res) => {
    const BRCH_ID = req.params.BRCH_ID;
    const CINEMA_NO = req.params.CINEMA_NO;

    if(!BRCH_ID || !CINEMA_NO) {
        res.status(405).send('check Branch ID or cinema NO');
        return;
    }

    seatService.findSeatsByCinemaNoAndBranchID(CINEMA_NO, BRCH_ID)
        .then((data) => res.send(data))
        .catch((error) => {console.log(error); res.status(404).send('not found');})
})

router.put('/seatType', (req,res) => {
    const {error} = validateSeatUpdate(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    const cinemaNumber = req.body.cinemaNumber;
    const branchId = req.body.branchId;
    const seatTypeId = req.body.seatTypeId;
    const seatObject = req.body.selectedSeatNames.map((seatName) => {
        return {
            SEAT_TYPE_ID: seatTypeId,
            BRCH_ID: branchId,
            CINEMA_NO: cinemaNumber,
            SEAT_NAME: seatName
        }
    });
    console.log(seatObject);
    seatService.updateSeatsSeatType(seatObject)
        .then((result) => res.send('success'))
        .catch((error) => res.status(400).send(error));
})
function validateSeatUpdate(seatUpdate) {
    const scheme = {
        cinemaNumber: Joi.number().required(),
        branchId: Joi.number().required(),
        seatTypeId: Joi.number().required(),
        selectedSeatNames: Joi.array().required()
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(seatUpdate,scheme);
}
module.exports = router;