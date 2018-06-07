'use strict';

var express = require('express');
var router = express.Router();
var Joi = require('joi');
var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var path = process.cwd();
var envModule = require(path + '/envModule');
var peopleService = require('./oraclDBService/peopleService');

var storage = multer.diskStorage({
	destination: function destination(req, file, cb) {
		cb(null, 'uploads/people');
	},
	filename: function filename(req, file, cb) {
		if (file.originalname.indexOf('.') !== -1) {
			var parsingNameArray = file.originalname.split('.');
			var extension = parsingNameArray[parsingNameArray.length - 1];
			cb(null, 'people' + file.fieldname + Date.now() + '.' + extension);
		} else {
			cb(null, 'people' + file.fieldname + Date.now());
		}
	}
});
var upload = multer({ storage: storage });

router.get('/', function (req, res) {
	var result = peopleService.findPeople();
	result.then(function (data) {
		res.send(data);
	});
});
router.post('/', upload.single('imageFile'), function (req, res) {
	console.log(req.file.path);

	var _validatePerson = validatePerson(req.body),
	    error = _validatePerson.error;

	console.log(req.body);
	if (error) {
		res.status(400).send(error.details[0].message);
		return;
	}
	var person = { id: people.length + 1, name: req.body.name, picture: '', role: req.body.role };
	if (req.file && req.file.path) {
		person.picture = req.file.path;
	}
	if (req.body.information) {
		person.information = req.body.information;
	}
	var personObject = {
		PER_NAME: person.name,
		PER_IMG: person.picture,
		ROLE: person.role
	};
	peopleService.insertPerson(personObject).then(function (data) {
		res.send(data);
	}).catch(function (error) {
		console.log(error);
		res.status(400).send('has error');
	});
});
function validatePerson(person) {
	var scheme = {
		name: Joi.string().min(1).required(),
		role: Joi.string().min(1).required()
		//		minAge: Joi.number().required(),
	};return Joi.validate(person, scheme);
}
module.exports = router;
//# sourceMappingURL=people.js.map