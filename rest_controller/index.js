const express = require('express');
const router = express.Router();


const courses = require('./courses');
const movies = require('./movies');
router.use('/api/courses', courses);
router.use('/api/movies', movies);
module.exports = router;