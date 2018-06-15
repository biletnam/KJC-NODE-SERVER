'use strict';

var dbConfig = require('../../config/oracle-db-config');
var oracledb = require('oracledb');
var commonUtil = require('../../commonModule/commonUtil');
var cinemaService = require('./cinemaService');
var movieService = require('./movieService');
var playInfoService = require('./playInfoService');
var bookSeatService = require('./bookSeatService');
function insertScheduleExecute(connection, scheduleObject) {
    console.log(scheduleObject);
    return connection.execute('INSERT INTO SCHEDULE \n    (SCHED_ID, MOVIE_ID, SCHED_DATE, SCHED_NO, PL_START_TIME, CINEMA_NO, BRCH_ID, PL_END_TIME, PT_ID)\n    VALUES(SCHEDULE_SEQ.NEXTVAL, :MOVIE_ID, TO_DATE(:SCHED_DATE,\'YYYYMMDD\'), :SCHED_NO, TO_DATE(:PL_START_TIME, \'YYYYMMDDHH24MI\'), :CINEMA_NO, :BRCH_ID, TO_DATE(:PL_END_TIME, \'YYYYMMDDHH24MI\'), :PT_ID)', { MOVIE_ID: scheduleObject.MOVIE_ID, SCHED_DATE: scheduleObject.SCHED_DATE,
        SCHED_NO: scheduleObject.SCHED_NO, PL_START_TIME: scheduleObject.PL_START_TIME,
        CINEMA_NO: scheduleObject.CINEMA_NO, BRCH_ID: scheduleObject.BRCH_ID,
        PL_END_TIME: scheduleObject.PL_END_TIME, PT_ID: scheduleObject.PT_ID }, { autoCommit: false }).then(function (result) {
        return connection;
    });
}
function insertSchedule(scheduleObject) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return insertScheduleExecute(connection, scheduleObject);
        }).then(function (connection) {
            return playInfoService.insertPlayInfoExecute(connection, scheduleObject);
        }).then(function (connection) {
            return bookSeatService.firstBatchInsert(connection, scheduleObject);
        }).then(function (connection) {
            connection.commit(function (err) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                }
                doRelease(connection);
                resolve('success');
            });
        }).catch(function (error) {
            return console.log(error);
        });
    });
}
function findScheduleByDate(date) {
    return new Promise(function (resolve, reject) {
        console.log(date);
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = 'SELECT *\n                FROM SCHEDULE S JOIN PLAY_TYPE PT ON(S.PT_ID = PT.PT_ID)\n                WHERE SCHED_DATE = TO_DATE(:SCHED_DATE, \'YYMMDD\')';
            connection.execute(sql, { SCHED_DATE: date }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        });
    });
}
function findAll() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = 'SELECT S.SCHED_ID, S.SCHED_NO, S.MOVIE_ID, TO_CHAR(S.SCHED_DATE, \'YYYY-MM-DD\') AS SCHED_DATE,\n                TO_CHAR(S.PL_START_TIME, \'YYYY-MM-DD"T"HH24:MI\') AS PL_START_TIME,\n                 TO_CHAR(S.PL_END_TIME, \'YYYY-MM-DD"T"HH24:MI\') AS PL_END_TIME,\n                 S.IS_PUBLIC, M.MOVIE_NAME,\n                 S.BRCH_ID, PT.PT_NAME, PT.PT_ID FROM SCHEDULE S JOIN PLAY_TYPE PT ON(S.PT_ID = PT.PT_ID) JOIN MOVIE M ON(M.MOVIE_ID = S.MOVIE_ID)\n                 ORDER BY SCHED_ID';
            connection.execute(sql, [], { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        });
    });
}
function deleteScheduleById(scheduleId) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return playInfoService.deletePlayInfoBySchedIdExecute(connection, scheduleId);
        }).then(function (connection) {
            return bookSeatService.deleteBookSeatByScheduleIdExecute(connection, scheduleId);
        }).then(function (connection) {
            connection.execute("DELETE FROM SCHEDULE WHERE SCHED_ID = :SCHED_ID AND IS_PUBLIC = 'N'", { SCHED_ID: scheduleId }, { autoCommit: true }, function (err, result) {
                if (err) {
                    doRelease(connection);
                    console.log(err);
                    reject(err);
                    return;
                }
                if (result.rowsAffected) {
                    connection.commit(function (err) {
                        if (err) {
                            doRelease(connection);
                            console.log(err);
                            reject(err);
                            return;
                        }
                        doRelease(connection);
                        resolve('success');
                    });
                } else {
                    doRelease(connection);
                    console.log('no delete');
                    reject('no delete');
                    return;
                }
            });
        }).catch(function (error) {
            console.log(error);reject(error);
        });
    });
}
function findMovieScheduleBetweenStartEnd(start, end, branchId, cinemaNO) {
    console.log(new Date());
    console.log(start);
    console.log(end);
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = 'SELECT MOVIE_ID, SCHED_NO , TO_CHAR(PL_START_TIME, \'YYYY-MM-DD"T"HH24:MI\') AS PL_START_TIME, \n                TO_CHAR(PL_END_TIME, \'YYYY-MM-DD"T"HH24:MI\') AS PL_END_TIME\n                FROM SCHEDULE \n                WHERE CINEMA_NO = :CINEMA_NO AND BRCH_ID = :BRCH_ID  AND\n                (TO_DATE(:PL_START_TIME, \'YYYYMMDDHH24MI\') BETWEEN PL_START_TIME AND PL_END_TIME \n                OR TO_DATE(:PL_END_TIME, \'YYYYMMDDHH24MI\') BETWEEN PL_START_TIME AND PL_END_TIME)';

            connection.execute(sql, { CINEMA_NO: cinemaNO, BRCH_ID: branchId, PL_START_TIME: start, PL_END_TIME: end }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    doRelease(connection);
                    reject('error');
                    console.log('error while findMovieScheduleBetweenStartEnd', err);
                    return;
                }
                console.log(result);
                doRelease(connection);
                resolve(result.rows);
            });
        });
    });
}
function findMovieScheduleBetween(movieId, date1, date2) {
    return new Promise(function (resolve, reject) {
        console.log(date1, date2);
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = 'SELECT S.SCHED_ID, S.MOVIE_ID, S.SCHED_NO, TO_CHAR(S.SCHED_DATE, \'YYYY-MM-DD\') AS SCHED_DATE,\n                TO_CHAR(S.PL_START_TIME, \'YYYY-MM-DD"T"HH24:MI\') AS PL_START_TIME,\n                TO_CHAR(S.PL_END_TIME, \'YYYY-MM-DD"T"HH24:MI\') AS PL_END_TIME,\n                S.CINEMA_NO, S.BRCH_ID, PT.PT_NAME, PT.PT_PRICE, PT.PT_ID\n                FROM SCHEDULE S JOIN PLAY_TYPE PT ON(S.PT_ID = PT.PT_ID)\n                WHERE MOVIE_ID = :MOVIE_ID AND SCHED_DATE BETWEEN  :SCHED_DATE_1 AND :SCHED_DATE_2';
            connection.execute(sql, { MOVIE_ID: movieId, SCHED_DATE_1: date1, SCHED_DATE_2: date2 }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        });
    });
}
function findPublicMovieScheduleBetween(movieId, date1, date2) {
    return new Promise(function (resolve, reject) {
        console.log(date1, date2);
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = 'SELECT S.SCHED_ID, S.MOVIE_ID, S.SCHED_NO, TO_CHAR(S.SCHED_DATE, \'YYYY-MM-DD\') AS SCHED_DATE,\n                TO_CHAR(S.PL_START_TIME, \'YYYY-MM-DD"T"HH24:MI\') AS PL_START_TIME,\n                TO_CHAR(S.PL_END_TIME, \'YYYY-MM-DD"T"HH24:MI\') AS PL_END_TIME,\n                S.CINEMA_NO, S.BRCH_ID, PT.PT_NAME, PT.PT_PRICE, PT.PT_ID\n                FROM SCHEDULE S JOIN PLAY_TYPE PT ON(S.PT_ID = PT.PT_ID)\n                WHERE MOVIE_ID = :MOVIE_ID AND IS_PUBLIC = \'Y\' \n                AND PL_START_TIME BETWEEN  TO_DATE(:SCHED_DATE_1, \'YYYYMMDDHH24MI\') AND TO_DATE(:SCHED_DATE_2, \'YYYYMMDDHH24MI\')\n                ORDER BY PL_START_TIME';
            connection.execute(sql, { MOVIE_ID: movieId, SCHED_DATE_1: date1, SCHED_DATE_2: date2 }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        });
    });
}
function toPublic(SCHED_ID) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = 'UPDATE SCHEDULE SET IS_PUBLIC = \'Y\' WHERE SCHED_ID = :SCHED_ID';
            connection.execute(sql, { SCHED_ID: SCHED_ID }, { outFormat: oracledb.OBJECT, autoCommit: true }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve('success');
            });
        });
    });
}
function doRelease(connection) {
    return connection.close(function (err) {
        if (err) {
            console.log(err);
        }
    });
}

module.exports = {
    insertSchedule: insertSchedule,
    findScheduleByDate: findScheduleByDate,
    findMovieScheduleBetween: findMovieScheduleBetween,
    findMovieScheduleBetweenStartEnd: findMovieScheduleBetweenStartEnd,
    findPublicMovieScheduleBetween: findPublicMovieScheduleBetween,
    findAll: findAll,
    toPublic: toPublic,
    deleteScheduleById: deleteScheduleById
};
//# sourceMappingURL=scheduleService.js.map