const express = require('express');
const router = express.Router();
const Joi = require('joi');
const scheduleService = require('./oraclDBService/scheduleService');
const commonUtil = require('../commonModule/commonUtil');
const loginUtil = require('../commonModule/loginUtil');
router.post('/', (req,res) => {
    console.log(req.body);
    const {error} = validateSchedule(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            const isDirector = decoded.isDirector;
            if(!isDirector) {
                res.status(403).send('login Required');
                return;
            }
            const date = req.body.date.replace(/-/g, '');
            const startTime = req.body.startTime.replace(/:/g, '');
            const endTime = req.body.endTime.replace(/:/g, '');
            const startTimeDate = date+startTime;
            const endTimeDate = date+endTime;
            const scheduleObject =
                {MOVIE_ID: req.body.movieId, SCHED_DATE: date,
                    SCHED_NO: req.body.sequence, PL_START_TIME: startTimeDate,
                    CINEMA_NO: req.body.cinemaNO, BRCH_ID: req.body.branchId,
                    PL_END_TIME: endTimeDate, PT_ID:  req.body.playTypeId};

            scheduleService.findMovieScheduleBetweenStartEnd(scheduleObject.PL_START_TIME, scheduleObject.PL_END_TIME, scheduleObject.BRCH_ID, scheduleObject.CINEMA_NO)
                .then((row) => {
                    console.log(row);
                    if(row.length > 0) {
                        throw JSON.stringify(row[0]) + 'already Exist';
                    } else {
                        console.log('whiy here');
                        return scheduleService.insertSchedule(scheduleObject);
                    }
                }).then((success) => {res.send('success')})
                .catch((error) => res.status(500).send(error));
        }).catch((error) => res.status(403).send(error));
})

router.get('/', (req,res) => {
    scheduleService.findAll()
        .then((data) => res.send(data))
        .catch((error) => res.status(500).send('nothing'));
})

router.get('/date/:date', (req, res) => {
    const date = req.params.date;
    if(isNaN(date)) {
        res.status(405).send('not support date Type, ex)20120930');
        return false;
    }
    scheduleService.findScheduleByDate(date)
        .then((data) => res.send(data))
        .catch((err) => res.status(500).send(err));
})
router.get('/movie/:movieId/date/:date/:date2', (req,res) => {
    const date1 = req.params.date;
    const date2 = req.params.date2;
    const movieId = req.params.movieId;
    if(isNaN(date1) || isNaN(date2) || isNaN(movieId)) {
        res.status(405).send('not support date Type, ex)20120930');
        return false;
    }
    scheduleService.findMovieScheduleBetween(movieId, date1, date2)
        .then((data) => res.send(data))
        .catch((error) => res.status(500).send(error));
})
router.get('/movie/:movieId/due/:due', (req, res) => {
    const due = req.params.due;
    const movieId = req.params.movieId;
    if(isNaN(due) || isNaN(movieId)) {
        res.status(405).send('not support date Type, ex)20120930');
        return false;
    }
    const today = new Date();
    const fromDateString = commonUtil.toOracleISOTimeString(today);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(due));
    dueDate.setHours(0,0,0,0);
    const dueDateString = commonUtil.toOracleISOTimeString(dueDate);
    scheduleService.findPublicMovieScheduleBetween(movieId, fromDateString, dueDateString)
        .then((data) => res.send(data))
        .catch((error) => res.status(500).send(error));
})
router.delete('/:id', (req,res) => {
    const id = req.params.id;
    if(!id) {
        res.status(405).send('no id');
    }
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            const isDirector = decoded.isDirector;
            if(!isDirector) {
                res.status(403).send('login Required');
                return;
            }
            scheduleService.deleteScheduleById(id)
                .then((data) => res.send(data))
                .catch((error) => res.status(500).send(error));
        }).catch((error) => res.status(403).send(error));

})
router.put('/public/:sid', (req, res) => {
    const sid = req.params.sid;
    if(!sid) {
        res.status(405).send('no sid');
    }
    console.log('here and public');
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            const isDirector = decoded.isDirector;
            console.log('here');
            if(!isDirector) {
                res.status(403).send('login required');
                return;
            }
            scheduleService.toPublic(sid)
                .then((data) => res.send('success'))
                .catch((error) => res.status(500).send('fail'));
        }).catch((error) => res.status(403).send(error));
})
router.put('/sellRate/:scheduleId', (req, res) => {
    const scheduleId = req.params.scheduleId;
    if(!scheduleId){
        res.status(405).send('no shedule id');
        return false;
    }
    loginUtil.tokenCheckPromise(req)
        .then((decoded) => {
            const isDirector = decoded.isDirector;
            if(!isDirector) {
                res.status(403).send('login Required');
                return;
            }
            scheduleService.calculateSellRateAndRegister(scheduleId)
                .then((data) => res.send(data))
                .catch((error) => res.status(500).send(error));
        }).catch((error) => res.status(403).send(error));

})
function validateSchedule(schedule) {
    const scheme = {
        date: Joi.string().min(1).required(),
        movieId: Joi.number().min(1).required(),
        startTime: Joi.string().min(1).required(),
        endTime: Joi.string().min(1).required(),
        cinemaNO: Joi.number().required(),
        branchId: Joi.number().required(),
        sequence: Joi.number().required(),
        playTypeId: Joi.number().required()
    }
    //		minAge: Joi.number().required(),
    return Joi.validate(schedule,scheme);
}

module.exports = router;