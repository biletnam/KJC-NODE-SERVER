'use strict';

var express = require('express');
var router = express.Router();

var courses = require('./courses');
var movies = require('./movies');
var people = require('./people');
var genres = require('./genres');
var customers = require('./customer');
var login = require('./login');

router.use('/api/customer', customers);
router.use('/api/courses', courses);
router.use('/api/movies', movies);
router.use('/api/genres', genres);
router.use('/api/people', people);
router.use('/api/login', login);

module.exports = router;
//# sourceMappingURL=index.js.map