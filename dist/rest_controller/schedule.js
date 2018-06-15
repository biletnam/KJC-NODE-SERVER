'use strict';

var express = require('express');
var router = express.Router();
var Joi = require('joi');
var scheduleService = require('./oraclDBService/scheduleService');
var commonUtil = require('../commonModule/commonUtil');
router.post('/', function (req, res) {
    console.log(req.body);

    var _validateSchedule = validateSchedule(req.body),
        error = _validateSchedule.error;

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    var date = req.body.date.replace(/-/g, '');
    var startTime = req.body.startTime.replace(/:/g, '');
    var endTime = req.body.endTime.replace(/:/g, '');
    var startTimeDate = date + startTime;
    var endTimeDate = date + endTime;
    var scheduleObject = { MOVIE_ID: req.body.movieId, SCHED_DATE: date,
        SCHED_NO: req.body.sequence, PL_START_TIME: startTimeDate,
        CINEMA_NO: req.body.cinemaNO, BRCH_ID: req.body.branchId,
        PL_END_TIME: endTimeDate, PT_ID: req.body.playTypeId };

    scheduleService.findMovieScheduleBetweenStartEnd(scheduleObject.PL_START_TIME, scheduleObject.PL_END_TIME, scheduleObject.BRCH_ID, scheduleObject.CINEMA_NO).then(function (row) {
        console.log(row);
        if (row.length > 0) {
            throw JSON.stringify(row[0]) + 'already Exist';
        } else {
            console.log('whiy here');
            return scheduleService.insertSchedule(scheduleObject);
        }
    }).then(function (success) {
        res.send('success');
    }).catch(function (error) {
        return res.status(500).send(error);
    });
});

router.get('/', function (req, res) {
    scheduleService.findAll().then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        return res.status(500).send('nothing');
    });
});

router.get('/date/:date', function (req, res) {
    var date = req.params.date;
    if (isNaN(date)) {
        res.status(405).send('not support date Type, ex)20120930');
        return false;
    }
    scheduleService.findScheduleByDate(date).then(function (data) {
        return res.send(data);
    }).catch(function (err) {
        return res.status(500).send(err);
    });
});
router.get('/movie/:movieId/date/:date/:date2', function (req, res) {
    var date1 = req.params.date;
    var date2 = req.params.date2;
    var movieId = req.params.movieId;
    if (isNaN(date1) || isNaN(date2) || isNaN(movieId)) {
        res.status(405).send('not support date Type, ex)20120930');
        return false;
    }
    scheduleService.findMovieScheduleBetween(movieId, date1, date2).then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        return res.status(500).send(error);
    });
});
router.get('/movie/:movieId/due/:due', function (req, res) {
    var due = req.params.due;
    var movieId = req.params.movieId;
    if (isNaN(due) || isNaN(movieId)) {
        res.status(405).send('not support date Type, ex)20120930');
        return false;
    }
    var today = new Date();
    var fromDateString = commonUtil.toOracleISOTimeString(today);
    var dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(due));
    dueDate.setHours(0, 0, 0, 0);
    var dueDateString = commonUtil.toOracleISOTimeString(dueDate);
    scheduleService.findPublicMovieScheduleBetween(movieId, fromDateString, dueDateString).then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        return res.status(500).send(error);
    });
});
router.delete('/:id', function (req, res) {
    var id = req.params.id;
    if (!id) {
        res.status(405).send('no id');
    }
    scheduleService.deleteScheduleById(id).then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        return res.status(500).send(error);
    });
});
router.put('/public/:sid', function (req, res) {
    var sid = req.params.sid;
    if (!sid) {
        res.status(405).send('no sid');
    }
    scheduleService.toPublic(sid).then(function (data) {
        return res.send('success');
    }).catch(function (error) {
        return res.status(500).send('fail');
    });
});
router.put('/sellRate/:scheduleId', function (req, res) {
    var scheduleId = req.params.scheduleId;
    if (!scheduleId) {
        res.status(405).send('no shedule id');
        return false;
    }
    scheduleService.calculateSellRateAndRegister(scheduleId).then(function (data) {
        return res.send(data);
    }).catch(function (error) {
        return res.status(500).send(error);
    });
});
function validateSchedule(schedule) {
    var scheme = {
        date: Joi.string().min(1).required(),
        movieId: Joi.number().min(1).required(),
        startTime: Joi.string().min(1).required(),
        endTime: Joi.string().min(1).required(),
        cinemaNO: Joi.number().required(),
        branchId: Joi.number().required(),
        sequence: Joi.number().required(),
        playTypeId: Joi.number().required()
        //		minAge: Joi.number().required(),
    };return Joi.validate(schedule, scheme);
}

module.exports = router;
//# sourceMappingURL=schedule.js.map