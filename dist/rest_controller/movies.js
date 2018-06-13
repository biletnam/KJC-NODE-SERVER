'use strict';

var express = require('express');
var router = express.Router();
var Joi = require('joi');
var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var pathModule = require('path');
var path = process.cwd();
var envModule = require(path + '/envModule');
var movieService = require('./oraclDBService/movieService');
var commonUtil = require('../commonModule/commonUtil');
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
function movieWrapper(rows) {
	var PERSON_COLUMN = ['PER_NAME', 'PER_IMG', 'CH_NAME', 'IS_MAIN', 'PER_ID'];
	var object = {};
	rows.map(function (m) {
		if (!object[m.MOVIE_ID]) {
			object[m.MOVIE_ID] = m;
		}
		if (!object[m.MOVIE_ID]['PERSON']) {
			object[m.MOVIE_ID]['PERSON'] = [];
		}
		if (m.PER_ID) {
			object[m.MOVIE_ID]['PERSON'].push({
				PER_ID: m.PER_ID,
				PER_NAME: m.PER_NAME,
				PER_IMG: m.PER_IMG,
				CH_NAME: m.CH_NAME,
				IS_MAIN: m.IS_MAIN
			});
		}
	});
	var exceptObject = Object.keys(object).map(function (key) {
		return commonUtil.getExceptKeyObject(object[key], PERSON_COLUMN);
	});
	return exceptObject;
}

router.get('/', function (req, res) {
	movieService.findAllMovie().then(function (rows) {
		res.send(movieWrapper(rows));
	}).catch(function (error) {
		console.log(error);
	});
});
router.get('/playing', function (req, res) {
	movieService.findAllPlayingMovie().then(function (data) {
		return res.send(movieWrapper(data));
	}).catch(function (error) {
		return res.status(500).send(error);
	});
});
router.get('/:id', function (req, res) {
	res.send('not yet');
}); //TODO 이거 해야 함.
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

router.put('/:id/playing/:value', function (req, res) {
	var movieId = req.params.id;
	var value = req.params.value;

	if (!movieId || !value) {
		res.status(405).send('has no parameter');
		return false;
	}
	movieService.moviePlayingChange(movieId, value).then(function (data) {
		return res.send(data);
	}).catch(function (error) {
		return res.status(500).send(error);
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