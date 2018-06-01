const express = require('express');
const router = express.Router();


const courses = require('./courses');
const movies = require('./movies');
const people = require('./people');
const genres = require('./genres');
router.use('/api/courses', courses);
router.use('/api/movies', movies);
router.use('/api/genres', genres);
router.use('/api/people', people);

module.exports = router;