const express = require('express');
const router = express.Router();

const movies = [
	{
		id: 1,
		image: 'http://localhost:5000/static/images/ironman1.jpg',
		genere: ['공포', '코미디', '로맨스'],
		minAge: '15세',
		name: '아이언맨 1',
		information: '토니스타크의 첫 등장. 마블 10년의 첫걸음을 떼다.',
		runningTime: '150',
		director: '토니 스타크',
		mainActor: '토니',
		subActors: ['스타크', '토니스']
	},
	{
		id: 2,
		image: 'http://localhost:5000/static/images/ironman2.jpg',
		genere: ['공포', '코미디', '로맨스'],
		minAge: '15세',
		name: '아이언맨 2',
		information: '토니스타크의 방심. 이상한 체인 아저씨.',
		runningTime: '150',
		director: '토니 스타크',
		mainActor: '토니',
		subActors: ['스타크', '토니스']
	},
	{
		id: 3,
		image: 'http://localhost:5000/static/images/ironman3.jpg',
		genere: ['공포', '코미디', '로맨스'],
		minAge: '15세',
		name: '아이언맨 3',
		information: '토니스타크의 공포. 아이언맨 다중 등장.',
		runningTime: '150',
		director: '토니 스타크',
		mainActor: '토니',
		subActors: ['스타크', '토니스']
	},
		{
		id: 4,
		image: 'http://localhost:5000/static/images/civilWar.jpg',
		genere: ['공포', '코미디', '로맨스'],
		minAge: '15세',
		name: '시빌워',
		information: '어벤저스 급 출연진 대거 등장',
		runningTime: '150',
		director: '토니 스타크',
		mainActor: '토니',
		subActors: ['스타크', '토니스']
	},
		{
		id: 5,
		image: 'http://localhost:5000/static/images/deadFull.jpg',
		genere: ['공포', '코미디', '로맨스'],
		minAge: '15세',
		name: '데드풀',
		information: '죽지 않는 남자.',
		runningTime: '150',
		director: '토니 스타크',
		mainActor: '토니',
		subActors: ['스타크', '토니스']
	},
		{
		id: 6,
		image: 'http://localhost:5000/static/images/welcomeToRural.jpg',
		genere: ['공포', '코미디', '로맨스'],
		minAge: '15세',
		name: '웰컴투 동막골',
		information: '추억의 영화.',
		runningTime: '150',
		director: '토니 스타크',
		mainActor: '토니',
		subActors: ['스타크', '토니스']
	},
		{
		id: 7,
		image: 'http://localhost:5000/static/images/antMan.jpg',
		genere: ['공포', '코미디', '로맨스'],
		minAge: '15세',
		name: '앤트맨',
		information: '작지만 강한 히어로.',
		runningTime: '150',
		director: '토니 스타크',
		mainActor: '토니',
		subActors: ['스타크', '토니스']
	}
]

router.get('/', (req, res) => {
	res.send(movies);
})
router.get('/:id', (req,res) => {
	const movie = movies.find(m => m.id === req.params.id);
	if(!movie) res.status(404).send(`There is No Movie of this ${req.params.id}`);
})
function validateMovie(movie) {
	const scheme = {
		name: Joi.string().min(3).required(),
		minAge: Joi.number().required(),
		information: Joi.string().min(10).required(),
		runningTime: Joi.number().required()
	}
	return Joi.validate(movie,scheme);
}
module.exports = router;