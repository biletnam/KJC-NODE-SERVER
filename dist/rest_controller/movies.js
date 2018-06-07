'use strict';

var express = require('express');
var router = express.Router();
var Joi = require('joi');
var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var pathModule = require('path');
var path = process.cwd();
var envModule = require(path + '/envModule');
var movieService = require('./oraclDBService/movieService');
var storage = multer.diskStorage({
	destination: function destination(req, file, cb) {
		cb(null, 'uploads/movie');
	},
	filename: function filename(req, file, cb) {
		if (file.originalname.indexOf('.') !== -1) {
			var parsingNameArray = file.originalname.split('.');
			var extension = parsingNameArray[parsingNameArray.length - 1];
			cb(null, 'movie' + file.fieldname + Date.now() + '.' + extension);
		} else {
			cb(null, 'movie' + file.fieldname + Date.now());
		}
	}
});
var upload = multer({ storage: storage });

var movies = [{
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
}, {
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
}, {
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
}, {
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
}, {
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
}, {
	id: 6,
	image: 'http://localhost:5000/static/images/welcomeToRural.jpg',
	genere: ['공포', '코미디', '로맨스'],
	minAge: '15세',
	name: '웰컴투 동막골',
	information: '추억의 영화.',
	runningTime: '150',
	director: '토니 스타크',
	mainActor: '토니 ㅁㅁㅁ',
	subActors: ['스타크', '토니스']
}, {
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
}];

router.get('/', function (req, res) {
	movieService.findAllMovie().then(function (result) {
		res.send(result);
	}).catch(function (error) {
		console.log(error);
	});
});
router.get('/:id', function (req, res) {
	var movie = movies.find(function (m) {
		return m.id === req.params.id;
	});
	if (!movie) res.status(404).send('There is No Movie of this ' + req.params.id);
});
router.post('/', upload.single('image'), function (req, res) {
	console.log(req.body);

	var _validateMovie = validateMovie(req.body),
	    error = _validateMovie.error;

	if (error) {
		res.status(400).send(error.details[0].message);
		return;
	}
	var genres = req.body.genre.join(', ');
	var movie = {
		MOVIE_NAME: req.body.name,
		open: req.body.openningDate,
		RUNTIME: req.body.runningTime,
		MOVIE_INTRO: req.body.information,
		MOVIE_IMG: req.file.path,
		RATE: req.body.rate,
		GENRE: genres,
		DIST: req.body.dist,
		PEOPLE: req.body.people ? req.body.people.map(function (p) {
			return JSON.parse(p);
		}) : null
	};
	movieService.insertMovie(movie).then(function (rows) {
		res.send('success');
	}).catch(function (error) {
		console.log(error);
	});
});
function validateMovie(movie) {
	var scheme = {
		name: Joi.string().min(1).required(),
		information: Joi.string().min(1).required(),
		runningTime: Joi.number().required(),
		dist: Joi.string().min(1).required(),
		rate: Joi.number().required(),
		people: Joi.array(),
		genre: Joi.array().items(Joi.string())
		//		minAge: Joi.number().required(),
	};return Joi.validate(movie, scheme);
}
module.exports = router;
//# sourceMappingURL=movies.js.map