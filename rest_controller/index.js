const express = require('express');
const router = express.Router();


const courses = require('./courses');
const movies = require('./movies');
const people = require('./people');
const genres = require('./genres');
const customers = require('./customer');
const login = require('./login');

router.use('/api/customer', customers);
router.use('/api/courses', courses);
router.use('/api/movies', movies);
router.use('/api/genres', genres);
router.use('/api/people', people);
router.use('/api/login', login);

module.exports = router;