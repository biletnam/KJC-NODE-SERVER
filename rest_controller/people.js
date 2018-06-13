const express = require('express');
const router = express.Router();
const Joi = require('joi');
const multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var path = process.cwd();
var envModule = require( path + '/envModule' );
const peopleService = require('./oraclDBService/peopleService');

const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null,'uploads/people')
	},
	filename: function(req,file,cb) {
		if(file.originalname.indexOf('.') !== -1) {
			const parsingNameArray = file.originalname.split('.');
			const extension = parsingNameArray[parsingNameArray.length - 1];
			cb(null, 'people' + file.fieldname + Date.now() + '.' + extension);
		}else {
			cb(null, 'people' + file.fieldname + Date.now());
		}
	}
})
const upload = multer({ storage: storage});

router.get('/', (req, res) => {
    const result = peopleService.findPeople();
    result.then((data) => {
        res.send(data);
	})
})
router.post('/',upload.single('imageFile'), (req,res) => {
	console.log(req.file.path);
	const {error} = validatePerson(req.body);
	console.log(req.body);
	if(error) {
		res.status(400).send(error.details[0].message);
		return;
	}
	const person = {name: req.body.name, picture: '', role: req.body.role};
	if(req.file && req.file.path) {
		person.picture = req.file.path;
	}
	if(req.body.information) {
		person.information = req.body.information;
	}
	const personObject = {
		PER_NAME: person.name,
		PER_IMG: person.picture,
		ROLE: person.role
	}
	peopleService.insertPerson(personObject)
		.then((data) => {
			res.send(data);
		})
		.catch((error) => {
		console.log(error);
		res.status(400).send('has error');
	});
})
function validatePerson(person) {
	const scheme = {
		name: Joi.string().min(1).required(),
		role: Joi.string().min(1).required()
	}
	//		minAge: Joi.number().required(),
	return Joi.validate(person,scheme);
}
module.exports = router;