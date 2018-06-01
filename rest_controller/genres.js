const express = require('express');
const router = express.Router();
const Joi = require('joi');

const genres = [
	{id: 1, name: '유머'},
	{id: 2, name: '코미디'}
]

router.get('/', (req, res) => {
	console.log('here');
	res.send(genres);
})
router.post('/', (req,res) => {
	console.log('들어왔엉');
	console.log(req.body);
	const {error} = validateGenre(req.body);
	if(error) {
		res.status(400).send(error.details[0].message);
	}
	const genre = {id: genres.length + 1, name: req.body.name};
	genres.push(genre);
	res.send(genres);
})
function validateGenre(genre) {
	const scheme = {
		name: Joi.string().min(1).required()	
	}
	return Joi.validate(genre,scheme);
}
module.exports = router;