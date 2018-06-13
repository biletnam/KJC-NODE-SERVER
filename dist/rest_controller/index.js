'use strict';

var express = require('express');
var router = express.Router();

var courses = require('./courses');
var movies = require('./movies');
var people = require('./people');
var genres = require('./genres');
var customers = require('./customer');
var login = require('./login');
var branch = require('./branch');
var seatType = require('./price/seatType');
var playType = require('./price/playType');
var cinema = require('./cinema');
var seats = require('./seats');
var schedule = require('./schedule');
var book_seat = require('./book_seat');
var ticket = require('./ticket');
var payMethod = require('./payMethod');
var discount = require('./discount');
router.use('/api/customer', customers);
router.use('/api/courses', courses);
router.use('/api/movies', movies);
router.use('/api/genres', genres);
router.use('/api/people', people);
router.use('/api/login', login);
router.use('/api/branch', branch);
router.use('/api/playType', playType);
router.use('/api/seatType', seatType);
router.use('/api/cinema', cinema);
router.use('/api/seats', seats);
router.use('/api/schedule', schedule);
router.use('/api/book_seat', book_seat);
router.use('/api/ticket', ticket);
router.use('/api/payMethod', payMethod);
router.use('/api/discount', discount);
module.exports = router;
//# sourceMappingURL=index.js.map