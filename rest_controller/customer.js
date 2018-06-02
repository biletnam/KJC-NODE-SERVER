const express = require('express');
const router = express.Router();
const Joi = require('joi');
const multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var path = process.cwd();
var envModule = require( path + '/envModule' );
const customerService = require('./oraclDBService/customerService');


router.get('/', (req, res) => {
    const result = customerService.findCustomers();
    result.then((data) => {
        res.send(data);
    })
})
router.post('/', (req,res) => {
    const result  = customerService.registerPeople();
    result.then((data) => {
        res.send(data);
    })
})
function validatePerson(person) {
    const scheme = {
        name: Joi.string().min(3).required(),
        information: Joi.string().min(1)
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(person,scheme);
}
module.exports = router;