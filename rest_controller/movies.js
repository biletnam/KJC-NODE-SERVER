const express = require('express');
const router = express.Router();
const Joi = require('joi');
const multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
const pathModule = require('path');
var path = process.cwd();
var envModule = require( path + '/envModule' );
const movieService = require('./oraclDBService/movieService');
const commonUtil = require('../commonModule/commonUtil');
const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null,'uploads/movie')
	},
	filename: function(req,file,cb) {
		if(file.originalname.indexOf('.') !== -1) {
			const parsingNameArray = file.originalname.split('.');
			const extension = parsingNameArray[parsingNameArray.length - 1];
			cb(null, 'movie' + file.fieldname + Date.now() + '.' + extension);
		}else {
			cb(null, 'movie' + file.fieldname + Date.now());
		}
	}
})
const upload = multer({ storage: storage});
function movieWrapper(rows) {
    const PERSON_COLUMN = ['PER_NAME', 'PER_IMG', 'CH_NAME', 'IS_MAIN', 'PER_ID'];
    const object = {};
    rows.map((m) => {
        if(!object[m.MOVIE_ID]) {
            object[m.MOVIE_ID] = m;
        }
        if(!object[m.MOVIE_ID]['PERSON']) {
            object[m.MOVIE_ID]['PERSON'] = [];
        }
        if(m.PER_ID) {
            object[m.MOVIE_ID]['PERSON'].push({
                PER_ID: m.PER_ID,
                PER_NAME: m.PER_NAME,
                PER_IMG: m.PER_IMG,
                CH_NAME: m.CH_NAME,
                IS_MAIN: m.IS_MAIN
            });
        }
    })
    const exceptObject = Object.keys(object).map((key) => {
        return commonUtil.getExceptKeyObject(object[key], PERSON_COLUMN);
    })
    return exceptObject;
}

router.get('/', (req, res) => {
	movieService.findAllMovie()
		.then((rows) => {
			res.send(movieWrapper(rows));
		}).catch((error) => {
		console.log(error);
	})
})
router.get('/playing',(req,res) => {
	movieService.findAllPlayingMovie()
		.then((data) => res.send(movieWrapper(data)))
		.catch((error) => res.status(500).send(error));
})
router.get('/:id', (req,res) => {
	res.send('not yet');
})//TODO 이거 해야 함.
router.post('/',upload.single('image'),(req, res) => {
	console.log(req.body);
	const {error} = validateMovie(req.body);
	if(error) {
		res.status(400).send(error.details[0].message);
		return;
	}
	const genres = req.body.genre.join(', ');
	const videoAddr = req.body.videoAddr;
	 const movie = {
	 	MOVIE_NAME: req.body.name,
	 	open: req.body.openningDate,
	 	RUNTIME: req.body.runningTime,
	 	MOVIE_INTRO: req.body.information,
	 	MOVIE_IMG: req.file.path,
	 	RATE: req.body.rate,
		 GENRE: genres,
		 DIST: req.body.dist,
		 PEOPLE: req.body.people ? req.body.people.map((p) => JSON.parse(p)) : null,
		 VIDEO_ADDR: videoAddr
	 }
     movieService.insertMovie(movie)
		 .then((rows) => {
	 		res.send('success');
		 }).catch((error) => {
	 	console.log(error);
	 })
})

router.put('/:id/playing/:value', (req, res) => {
	const movieId = req.params.id;
	const value = req.params.value;

	if(!movieId || !value) {
		res.status(405).send('has no parameter');
		return false;
	}
	movieService.moviePlayingChange(movieId, value)
		.then((data) => res.send(data))
		.catch((error) => res.status(500).send(error));
})
function validateMovie(movie) {
	const scheme = {
		name: Joi.string().min(1).required(),
		information: Joi.string().min(1).required(),
		runningTime: Joi.number().required(),
		dist: Joi.string().min(1).required(),
		rate: Joi.number().required(),
		people: Joi.array(),
		genre: Joi.array().items(Joi.string()),
		videoAddr: Joi.string()
	}
	//		minAge: Joi.number().required(),
	return Joi.validate(movie,scheme);
}
module.exports = router;