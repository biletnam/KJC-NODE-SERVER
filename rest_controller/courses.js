const express = require('express');
const router = express.Router();
const courses = [
	{id:1, text: 'courses1'},
	{id:2, text: 'courses2'},
	{id:3, text: 'courses3'}
]

router.use((req, res, next) => next());
router.get('/', (req, res) => {
	res.send(courses);
});

router.get('/:id', (req, res) => {
	const course = courses.find(c => c.id === parseInt(req.params.id));

	if(!course) {
		res.status(404).send("we Can't find that");
	}
	res.send(course);
})
router.post('/', (req,res) => {
	const {error} = valdiateCourse(req.body);
	if(error) {
		res.status(400).send(error.details[0].message);
		return;
	}

 const course = {
 	id: courses.length + 1,
 	name: req.body.name
 }
 courses.push(course);
 res.send(course);
})

router.put('/:id', (req,res) => {
	const course = courses.find(c => c.id === parseInt(req.params.id));
	if(!course) res.status(404).send('Not Found That Id')
	const {error} = valdiateCourse(req.body);
	if(error) {
		res.status(400).send(error.details[0].message);
		return;
	}
	course.name = req.body.name;
	res.send(course);
})

function valdiateCourse(course) {
	const scheme = {
		name: Joi.string().min(3).required()
	}
	return Joi.validate(course,scheme);
}

module.exports = router