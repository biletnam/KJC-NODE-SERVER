const express = require('express');
const router = express.Router();
const seatTypeService = require('../oraclDBService/price/seatTypeService');
const Joi = require('joi');

router.get('/', (req, res) => {
    seatTypeService.findSeatTypeAll()
        .then((data) => res.send(data))
        .catch((error) => res.status(400).send('find seat type'));
});

router.post('/', (req, res) =>{
    console.log(req.body);
    const {error} = validateSeatType(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    const seatTypeObject = {
        SEAT_TYPE_NAME: req.body.name,
        ADD_COST: req.body.price
    }
    seatTypeService.insertSeatType(seatTypeObject)
        .then((result) => {res.send('success')})
        .catch((error) => console.log(error));
});

function validateSeatType(seatType) {
    const scheme = {
        name: Joi.string().min(1).required(),
        price: Joi.number().min(0).required()
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(seatType,scheme);
}

module.exports = router;