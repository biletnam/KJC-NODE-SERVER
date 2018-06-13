'use strict';

var express = require('express');
var router = express.Router();
var bookSeatService = require('./oraclDBService/bookSeatService');
var Joi = require('joi');

router.get('/:SCHED_ID', function (req, res) {
    var SCHED_ID = req.params.SCHED_ID;
    if (!SCHED_ID) {
        res.send(405).send('bad request, there is no SCHED_ID');
    }
    console.log('get Request');
    bookSeatService.findBookSeatByScheduleId(SCHED_ID).then(function (data) {
        res.send(data);
    }).catch(function (error) {
        res.status(500).send(error);console.log('error');
    });
});

router.post('/:SCHED_ID/bookNames', function (req, res) {
    var bookNames = ['A01', 'A02'];
    var scehduleId = req.params.SCHED_ID;
    console.log(bookNames);
    if (!bookNames || !scehduleId) {
        res.status(405).send('bad request');
    }

    bookSeatService.findBookSeatByScheduleIdAndSeatNames(scehduleId, bookNames).then(function (data) {
        res.send(data);
    }).catch(function (err) {
        res.status(404).send('no where');
    });
});

module.exports = router;
//# sourceMappingURL=book_seat.js.map