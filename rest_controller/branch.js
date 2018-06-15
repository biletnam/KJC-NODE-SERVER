const express = require('express');
const router = express.Router();
const branchService = require('./oraclDBService/branchService');
const Joi = require('joi');
const loginUtil = require('../commonModule/loginUtil');
router.get('/', (req, res) => {
    console.log('get Request');
    branchService.findAllBranch().then((data) => {
        res.send(data);
    }).catch((error) => console.log('error'));
})
router.post('/', (req, res) => {
    const {error} = validateBranch(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            const isDirector = decoded.isDirector;
            if(!isDirector) {
                res.status(403).send('no director');
                return;
            }
            const branchObject = {
                BRANCH_NAME: req.body.name,
                ZIP_CODE: req.body.zipCode,
                ADDR: req.body.address,
                ADDR_DET: req.body.address_detail
            }
            branchService.insertBranch(branchObject)
                .then((result) => {console.log('success'); res.send(result);})
                .catch((error) => {res.status(400).send('error while insert1')});
        }).catch((error) => res.status(403).send(error))
})

function validateBranch(branch) {
    const scheme = {
        name: Joi.string().min(3).required(),
        zipCode: Joi.string().min(1).required(),
        address: Joi.string().min(1).required(),
        address_detail:Joi.string().min(1).required(),
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(branch,scheme);
}

module.exports = router;