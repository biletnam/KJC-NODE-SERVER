const express = require('express');
const router = express.Router();
const Joi = require('joi');
const discountService = require('./oraclDBService/discountService');
router.get('/', (req,res) => {
    discountService.findAll()
        .then((data) => res.send(data))
        .catch((error) => res.status(500).send(error));
})
router.post('/', (req,res) => {
    const {error} = validateDiscount(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    const discountObject = {DISC_NAME: req.body.name, DISC_METHOD: req.body.discountMethod,
        DISC_AMT: req.body.discountAmount};

    discountService.insertDiscount(discountObject)
        .then((data) => res.send(data))
        .catch((error) => res.status(500).send(error));
})

function validateDiscount(discount) {
    const scheme = {
        name: Joi.string().min(1).required(),
        discountMethod: Joi.string().required(),
        discountAmount: Joi.number().required()
    }
    return Joi.validate(discount,scheme);
}

module.exports = router;