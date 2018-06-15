'use strict';

var express = require('express');
var router = express.Router();
var ticketService = require('./oraclDBService/ticketService');
var bookSeatService = require('./oraclDBService/bookSeatService');
var payHistoryService = require('./oraclDBService/payHistoryService');
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
            res.send({ ticket: data });
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

router.get('/of/customer', function (req, res) {
    loginUtil.tokenCheckPromise(req).then(function (decoded) {
        var CUST_ID = decoded._c_id;
        console.log(CUST_ID);
        ticketService.findMeaningTicketByCustomerId(CUST_ID).then(function (data) {
            return res.send(data);
        }).catch(function (error) {
            return res.status(500).send(error);
        });
    }).catch(function (error) {
        res.status(403).send('login required');
    });
});
router.put('/ticketing', function (req, res) {
    var _validateTicketingTic = validateTicketingTicket(req.body),
        error = _validateTicketingTic.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    loginUtil.tokenCheckPromise(req).then(function (decoded) {
        return new Promise(function (resolve, reject) {
            var CUST_ID = decoded._c_id;
            console.log(CUST_ID);
            ticketService.findTicketById(req.body.TCK_ID).then(function (data) {
                var ticket = data[0];
                console.log(ticket);
                if (ticket.CUST_ID !== Number(CUST_ID)) {
                    reject('no Customer Error');
                    return;
                }
                ticketService.updateTicketTo(req.body.TCK_ID, 'T').then(function (data) {
                    return resolve('success');
                }).catch(function (error) {
                    return reject('error');
                });
            });
        });
    }).then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        return res.status(405).send('login required');
    });
});
router.put('/refund', function (req, res) {
    var _validateRefundTicket = validateRefundTicket(req.body),
        error = _validateRefundTicket.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }

    loginUtil.tokenCheckPromise(req).then(function (decoded) {
        return new Promise(function (resolve, reject) {
            var CUST_ID = decoded._c_id;
            var isUser = decoded.isUser;
            console.log(CUST_ID);
            ticketService.findTicketById(req.body.TCK_ID).then(function (data) {
                var ticket = data[0];
                console.log(ticket);
                if (ticket.CUST_ID !== Number(CUST_ID)) {
                    reject('no Customer Error');
                    return;
                }
                return payHistoryService.findPayHistoryByTicketId(ticket.TCK_ID);
            }).then(function (data) {
                var payHistory = data[0];
                if (!payHistory) {
                    reject('no pay History Error');
                }
                if (isUser) {
                    payHistory.IS_USER = 'Y';
                } else {
                    payHistory.IS_USER = 'N';
                }
                return payHistoryService.refund(payHistory);
            }).then(function (data) {
                resolve(data);
            }).catch(function (error) {
                reject(error);
            });
        });
    }).then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        res.status(403).send(error);
    });
});
router.delete('/:id', function (req, res) {
    var id = req.params.id;
    if (!id) {
        res.status(405).send('no parameter');
        return;
    }
    ticketService.checkAndResetTicket(id).then(function (data) {
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
function validateRefundTicket(ticketObject) {
    var scheme = {
        TCK_ID: Joi.number()
    };
    return Joi.validate(ticketObject, scheme);
}
function validateTicketingTicket(ticketObject) {
    var scheme = {
        TCK_ID: Joi.number()
    };
    return Joi.validate(ticketObject, scheme);
}
module.exports = router;
//# sourceMappingURL=ticket.js.map