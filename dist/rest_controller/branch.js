'use strict';

var express = require('express');
var router = express.Router();
var branchService = require('./oraclDBService/branchService');
var Joi = require('joi');

router.get('/', function (req, res) {
    console.log('get Request');
    branchService.findAllBranch().then(function (data) {
        res.send(data);
    }).catch(function (error) {
        return console.log('error');
    });
});
router.post('/', function (req, res) {
    var _validateBranch = validateBranch(req.body),
        error = _validateBranch.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    var branchObject = {
        BRANCH_NAME: req.body.name,
        ZIP_CODE: req.body.zipCode,
        ADDR: req.body.address,
        ADDR_DET: req.body.address_detail
    };
    branchService.insertBranch(branchObject).then(function (result) {
        console.log('success');res.send(result);
    }).catch(function (error) {
        res.status(400).send('error while insert1');
    });
});

function validateBranch(branch) {
    var scheme = {
        name: Joi.string().min(3).required(),
        zipCode: Joi.string().min(1).required(),
        address: Joi.string().min(1).required(),
        address_detail: Joi.string().min(1).required()
        //		minAge: Joi.number().required(),
    };return Joi.validate(branch, scheme);
}

module.exports = router;
//# sourceMappingURL=branch.js.map