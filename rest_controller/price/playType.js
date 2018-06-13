const express = require('express');
const router = express.Router();
const playTypeService = require('../oraclDBService/price/playTypeService');
const Joi = require('joi');

router.get('/', (req, res) => {
    playTypeService.findPlayTypeAll()
        .then((data) => res.send(data))
        .catch((error) => res.status(400).send('find seat type'));
});

router.post('/', (req, res) => {
    const {error} = validatePlayType(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    const playTypeObject = {
        PT_NAME: req.body.name,
        PT_PRICE: req.body.price
    }
    playTypeService.insertPlayType(playTypeObject)
        .then((result) => {res.send('success')})
        .catch((error) => console.log(error));
});

function validatePlayType(playType) {
    const scheme = {
        name: Joi.string().min(1).required(),
        price: Joi.number().min(0).required()
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(playType,scheme);
}

module.exports = router;