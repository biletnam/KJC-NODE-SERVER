const express = require('express');
const router = express.Router();
const bookSeatService = require('./oraclDBService/bookSeatService');
const Joi = require('joi');


router.get('/:SCHED_ID', (req, res) => {
    const SCHED_ID = req.params.SCHED_ID;
    if(!SCHED_ID) {
        res.send(405).send('bad request, there is no SCHED_ID');
    }
    console.log('get Request');
    bookSeatService.findBookSeatByScheduleId(SCHED_ID).then((data) => {
        res.send(data);
    }).catch((error) => { res.status(500).send(error); console.log('error');});
})

router.post('/:SCHED_ID/bookNames', (req, res) => {
    const bookNames = ['A01', 'A02'];
    const scehduleId = req.params.SCHED_ID;
    console.log(bookNames);
    if(!bookNames || !scehduleId) {
        res.status(405).send('bad request');
    }

    bookSeatService.findBookSeatByScheduleIdAndSeatNames(scehduleId, bookNames)
        .then((data) => {res.send(data)})
        .catch((err) => {res.status(404).send('no where')});

})

module.exports = router;