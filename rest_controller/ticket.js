const express = require('express');
const router = express.Router();
const ticketService = require('./oraclDBService/ticketService');
const bookSeatService = require('./oraclDBService/bookSeatService');
const loginUtil = require('../commonModule/loginUtil');
const Joi = require('joi');


router.post('/', (req, res) => {
    const {error} = validateTicket(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }

    const selectedSchedule = req.body.selectedSchedule;
    const selectedChair = req.body.selectedChair;
    const seatNames = selectedChair.map((c) => c.SEAT_NAME);
    const scheduleId = selectedSchedule.SCHED_ID;
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            const CUST_ID = decoded._c_id;
            bookSeatService.findBookSeatByScheduleIdAndSeatNames(scheduleId, seatNames)
                .then((result) => {
                    const TCK_PRICE = result.reduce((prev, seat) => prev + seat.BOOK_PRICE, 0);
                    const SEAT_NAME = result.map((b) => b.SEAT_NAME).join(',');
                    const ticketObject =  {CUST_ID: CUST_ID, TCK_PRICE: TCK_PRICE,
                        BOOK_SEAT_CNT: result.length, SCHED_ID: scheduleId, SEAT_NAME: SEAT_NAME, seatNames: seatNames};
                        console.log(ticketObject);
                    return ticketService.createTicket(ticketObject);
                })
                .then((data) => {res.send(data)})
                .catch((error) => {res.status(500).send(error)});
        }).catch((error) => {res.status(403).send('login required')});
})

router.get('/:id', (req, res) => {
    const id = req.params.id;
    if(!id) {
        res.status(405).send('no parameter');
        return;
    }
    ticketService.findTicketById(id)
        .then((data) => {res.send(data)})
        .catch((error) => {res.status(500).send(error)});
})

router.delete('/:id', (req,res) => {
    const id = req.params.id;
    if(!id) {
        res.status(405).send('no parameter');
        return;
    }
    ticketService.checkAndResetTciket(id)
        .then((data) => res.send(data))
        .catch((error) => res.status(500).send(error));
})


function validateTicket(ticketObject) {
    const scheme = {
        selectedSchedule: Joi.object().required(),
        selectedChair: Joi.array().required()
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(ticketObject,scheme);
}
module.exports = router;