const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');
const commonUtil = require('../../commonModule/commonUtil');
const cinemaService = require('./cinemaService');
const movieService = require('./movieService');
const playInfoService = require('./playInfoService');
const bookSeatService = require('./bookSeatService');
function insertScheduleExecute(connection,scheduleObject) {
    console.log(scheduleObject);
    return connection.execute(`INSERT INTO SCHEDULE 
    (SCHED_ID, MOVIE_ID, SCHED_DATE, SCHED_NO, PL_START_TIME, CINEMA_NO, BRCH_ID, PL_END_TIME, PT_ID)
    VALUES(SCHEDULE_SEQ.NEXTVAL, :MOVIE_ID, TO_DATE(:SCHED_DATE,'YYYYMMDD'), :SCHED_NO, TO_DATE(:PL_START_TIME, 'YYYYMMDDHH24MI'), :CINEMA_NO, :BRCH_ID, TO_DATE(:PL_END_TIME, 'YYYYMMDDHH24MI'), :PT_ID)`,
        {MOVIE_ID: scheduleObject.MOVIE_ID, SCHED_DATE: scheduleObject.SCHED_DATE,
        SCHED_NO: scheduleObject.SCHED_NO, PL_START_TIME: scheduleObject.PL_START_TIME,
        CINEMA_NO: scheduleObject.CINEMA_NO, BRCH_ID: scheduleObject.BRCH_ID,
        PL_END_TIME: scheduleObject.PL_END_TIME, PT_ID: scheduleObject.PT_ID}, {autoCommit: false})
        .then((result) => connection)
}
function insertSchedule(scheduleObject) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return insertScheduleExecute(connection, scheduleObject);
            }).then((connection) => {
            return playInfoService.insertPlayInfoExecute(connection, scheduleObject);
        }).then((connection) => {
            return bookSeatService.firstBatchInsert(connection, scheduleObject);
        }).then((connection) => {
            connection.commit((err) => {
                if(err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                }
                doRelease(connection);
                resolve('success');
            })
        }).catch((error) => console.log(error));
    })
}
function findScheduleByDate(date) {
    return new Promise((resolve, reject) => {
        console.log(date);
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `SELECT *
                FROM SCHEDULE S JOIN PLAY_TYPE PT ON(S.PT_ID = PT.PT_ID)
                WHERE SCHED_DATE = TO_DATE(:SCHED_DATE, 'YYMMDD')`;
                connection.execute(sql, {SCHED_DATE: date}, {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err) {
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            })
    })
}
function findAll() {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `SELECT S.SCHED_ID, S.SCHED_NO, S.MOVIE_ID, TO_CHAR(S.SCHED_DATE, 'YYYY-MM-DD') AS SCHED_DATE,
                TO_CHAR(S.PL_START_TIME, 'YYYY-MM-DD"T"HH24:MI') AS PL_START_TIME,
                 TO_CHAR(S.PL_END_TIME, 'YYYY-MM-DD"T"HH24:MI') AS PL_END_TIME,
                 S.IS_PUBLIC, M.MOVIE_NAME,
                 S.BRCH_ID, PT.PT_NAME, PT.PT_ID FROM SCHEDULE S JOIN PLAY_TYPE PT ON(S.PT_ID = PT.PT_ID) JOIN MOVIE M ON(M.MOVIE_ID = S.MOVIE_ID)
                 ORDER BY SCHED_ID`;
                connection.execute(sql, [] , {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err) {
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            })
    })
}
function deleteScheduleById(scheduleId) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => playInfoService.deletePlayInfoBySchedIdExecute(connection,scheduleId))
            .then((connection) => bookSeatService.deleteBookSeatByScheduleIdExecute(connection, scheduleId))
            .then((connection) => {
                connection.execute("DELETE FROM SCHEDULE WHERE SCHED_ID = :SCHED_ID AND IS_PUBLIC = 'N'", {SCHED_ID: scheduleId}, {autoCommit: true},
                    (err, result) => {
                        if(err) {
                            doRelease(connection);
                            console.log(err);
                            reject(err);
                            return;
                        }
                        if(result.rowsAffected) {
                            connection.commit((err) => {
                                if(err){
                                    doRelease(connection);
                                    console.log(err);
                                    reject(err);
                                    return;
                                }
                                doRelease(connection);
                                resolve('success');
                            })
                        }else {
                            doRelease(connection);
                            console.log('no delete');
                            reject('no delete');
                            return;
                        }
                    })
            }).catch((error) => { console.log(error); reject(error)});
    })
}
function findMovieScheduleBetweenStartEnd(start, end, branchId, cinemaNO) {
    console.log(new Date());
    console.log(start);
    console.log(end);
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `SELECT MOVIE_ID, SCHED_NO , TO_CHAR(PL_START_TIME, 'YYYY-MM-DD"T"HH24:MI') AS PL_START_TIME, 
                TO_CHAR(PL_END_TIME, 'YYYY-MM-DD"T"HH24:MI') AS PL_END_TIME
                FROM SCHEDULE 
                WHERE CINEMA_NO = :CINEMA_NO AND BRCH_ID = :BRCH_ID  AND
                (TO_DATE(:PL_START_TIME, 'YYYYMMDDHH24MI') BETWEEN PL_START_TIME AND PL_END_TIME 
                OR TO_DATE(:PL_END_TIME, 'YYYYMMDDHH24MI') BETWEEN PL_START_TIME AND PL_END_TIME)`;

                connection.execute(sql, {CINEMA_NO: cinemaNO, BRCH_ID: branchId, PL_START_TIME: start, PL_END_TIME: end},
                    {outFormat: oracledb.OBJECT},
                    (err, result) => {
                        if(err) {
                            doRelease(connection);
                            reject('error');
                            console.log('error while findMovieScheduleBetweenStartEnd', err);
                            return;
                        }
                        console.log(result);
                        doRelease(connection);
                        resolve(result.rows);
                    })
            })
    })
}
function findMovieScheduleBetween(movieId, date1, date2) {
    return new Promise((resolve, reject) => {
        console.log(date1, date2);
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `SELECT S.SCHED_ID, S.MOVIE_ID, S.SCHED_NO, TO_CHAR(S.SCHED_DATE, 'YYYY-MM-DD') AS SCHED_DATE,
                TO_CHAR(S.PL_START_TIME, 'YYYY-MM-DD"T"HH24:MI') AS PL_START_TIME,
                TO_CHAR(S.PL_END_TIME, 'YYYY-MM-DD"T"HH24:MI') AS PL_END_TIME,
                S.CINEMA_NO, S.BRCH_ID, PT.PT_NAME, PT.PT_PRICE, PT.PT_ID
                FROM SCHEDULE S JOIN PLAY_TYPE PT ON(S.PT_ID = PT.PT_ID)
                WHERE MOVIE_ID = :MOVIE_ID AND SCHED_DATE BETWEEN  :SCHED_DATE_1 AND :SCHED_DATE_2`;
                connection.execute(sql, {MOVIE_ID: movieId, SCHED_DATE_1: date1, SCHED_DATE_2: date2}, {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err) {
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            })
    })
}
function findPublicMovieScheduleBetween(movieId, date1, date2) {
    return new Promise((resolve, reject) => {
        console.log(date1, date2);
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `SELECT S.SCHED_ID, S.MOVIE_ID, S.SCHED_NO, TO_CHAR(S.SCHED_DATE, 'YYYY-MM-DD') AS SCHED_DATE,
                TO_CHAR(S.PL_START_TIME, 'YYYY-MM-DD"T"HH24:MI') AS PL_START_TIME,
                TO_CHAR(S.PL_END_TIME, 'YYYY-MM-DD"T"HH24:MI') AS PL_END_TIME,
                S.CINEMA_NO, S.BRCH_ID, PT.PT_NAME, PT.PT_PRICE, PT.PT_ID
                FROM SCHEDULE S JOIN PLAY_TYPE PT ON(S.PT_ID = PT.PT_ID)
                WHERE MOVIE_ID = :MOVIE_ID AND IS_PUBLIC = 'Y' 
                AND PL_START_TIME BETWEEN  TO_DATE(:SCHED_DATE_1, 'YYYYMMDDHH24MI') AND TO_DATE(:SCHED_DATE_2, 'YYYYMMDDHH24MI')
                ORDER BY PL_START_TIME`;
                connection.execute(sql, {MOVIE_ID: movieId, SCHED_DATE_1: date1, SCHED_DATE_2: date2}, {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err) {
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            })
    })
}
function toPublic(SCHED_ID) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `UPDATE SCHEDULE SET IS_PUBLIC = 'Y' WHERE SCHED_ID = :SCHED_ID`;
                connection.execute(sql, {SCHED_ID: SCHED_ID}, {outFormat: oracledb.OBJECT, autoCommit: true}, (err, result) => {
                    if(err) {
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve('success');
                })
            })
    })
}
function doRelease(connection) {
    return connection.close((err) => {
        if(err) {
            console.log(err);
        }
    })
}

module.exports = {
    insertSchedule,
    findScheduleByDate,
    findMovieScheduleBetween,
    findMovieScheduleBetweenStartEnd,
    findPublicMovieScheduleBetween,
    findAll,
    toPublic,
    deleteScheduleById
}