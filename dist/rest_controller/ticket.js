'use strict';

var express = require('express');
var router = express.Router();
var ticketService = require('./oraclDBService/ticketService');
var bookSeatService = require('./oraclDBService/bookSeatService');
var loginUtil = require('../commonModule/loginUtil');
var Joi = require('joi');

router.post('/', function (req, res) {
    var _validateTicket = validateTicket(req.body),
        error = _validateTicket.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }

    var selectedSchedule = req.body.selectedSchedule;
    var selectedChair = req.body.selectedChair;
    var seatNames = selectedChair.map(function (c) {
        return c.SEAT_NAME;
    });
    var scheduleId = selectedSchedule.SCHED_ID;
    loginUtil.tokenCheckPromise(req).then(function (decoded) {
        var CUST_ID = decoded._c_id;
        bookSeatService.findBookSeatByScheduleIdAndSeatNames(scheduleId, seatNames).then(function (result) {
            var TCK_PRICE = result.reduce(function (prev, seat) {
                return prev + seat.BOOK_PRICE;
            }, 0);
            var SEAT_NAME = result.map(function (b) {
                return b.SEAT_NAME;
            }).join(',');
            var ticketObject = { CUST_ID: CUST_ID, TCK_PRICE: TCK_PRICE,
                BOOK_SEAT_CNT: result.length, SCHED_ID: scheduleId, SEAT_NAME: SEAT_NAME, seatNames: seatNames };
            console.log(ticketObject);
            return ticketService.createTicket(ticketObject);
        }).then(function (data) {
            res.send(data);
        }).catch(function (error) {
            res.status(500).send(error);
        });
    }).catch(function (error) {
        res.status(403).send('login required');
    });
});

router.get('/:id', function (req, res) {
    var id = req.params.id;
    if (!id) {
        res.status(405).send('no parameter');
        return;
    }
    ticketService.findTicketById(id).then(function (data) {
        res.send(data);
    }).catch(function (error) {
        res.status(500).send(error);
    });
});

router.delete('/:id', function (req, res) {
    var id = req.params.id;
    if (!id) {
        res.status(405).send('no parameter');
        return;
    }
    ticketService.checkAndResetTciket(id).then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        return res.status(500).send(error);
    });
});

function validateTicket(ticketObject) {
    var scheme = {
        selectedSchedule: Joi.object().required(),
        selectedChair: Joi.array().required()
        //		minAge: Joi.number().required(),
    };return Joi.validate(ticketObject, scheme);
}
module.exports = router;
//# sourceMappingURL=ticket.js.map