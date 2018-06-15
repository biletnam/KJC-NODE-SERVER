'use strict';

var dbConfig = require('../../config/oracle-db-config');
var oracledb = require('oracledb');
var commonUtil = require('../../commonModule/commonUtil');

var playTypeService = require('./price/playTypeService');
var seatService = require('./seatService');

function firstBatchInsert(connection, scheduleObject) {
    var playTypeP = playTypeService.findPlayTypeById(scheduleObject.PT_ID);
    var seatsP = seatService.findSeatsByCNOAndBIDWithSeatType(scheduleObject.CINEMA_NO, scheduleObject.BRCH_ID);
    return Promise.all([playTypeP, seatsP]).then(function (values) {
        var playType = values[0][0];
        var seats = values[1];
        var bookSeatObjectArray = seats.map(function (s) {
            return { SEAT_NAME: s.SEAT_NAME, BOOK_PRICE: playType.PT_PRICE + s.ADD_COST, CINEMA_NO: scheduleObject.CINEMA_NO, BRCH_ID: scheduleObject.BRCH_ID };
        });
        console.log(bookSeatObjectArray);
        return connection.executeMany('INSERT INTO BOOK_SEAT (SCHED_ID, SEAT_NAME, BOOK_PRICE, CINEMA_NO, BRCH_ID)\n            VALUES(SCHEDULE_SEQ.CURRVAL, :SEAT_NAME, :BOOK_PRICE, :CINEMA_NO, :BRCH_ID)', bookSeatObjectArray, { autoCommit: false }).then(function (result) {
            return connection;
        });
    });
}
function findBookSeatByScheduleId(SCHED_ID) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            connection.execute('SELECT * FROM BOOK_SEAT WHERE SCHED_ID = :SCHED_ID', { SCHED_ID: Number(SCHED_ID) }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log('error while select', err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (error) {
            return console.log(error);
        });
    });
}

function findBookSeatByScheduleIdAndSeatNames(scheduleId, seatNames) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = 'SELECT * FROM BOOK_SEAT WHERE SCHED_ID = ' + scheduleId + ' AND SEAT_NAME IN (' + seatNames.map(function (s, i) {
                return ':' + i;
            }).join(', ') + ')';
            connection.execute(sql, seatNames, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log('error while select', err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (error) {
            return console.log(error);
        });
    });
}
function updateBookSeatTicketAndBookable(connection, ticketId, ticketObject) {
    var scheduleId = ticketObject.SCHED_ID;
    var seatNames = ticketObject.seatNames;
    var sql = 'UPDATE BOOK_SEAT SET TCK_ID=' + ticketId + ' WHERE SCHED_ID = ' + scheduleId + ' AND SEAT_NAME IN(' + seatNames.map(function (s, i) {
        return ':' + i;
    }).join(', ') + ')';
    return connection.execute(sql, seatNames, { autoCommit: false, outFormat: oracledb.OBJECT }).then(function (result) {
        return connection;
    });
}

function resetBookSeatTicket(connection, ticketId) {
    var sql = 'UPDATE BOOK_SEAT SET TCK_ID = NULL WHERE TCK_ID = ' + ticketId;
    console.log(sql);
    return connection.execute(sql, [], { autoCommit: false, outFormat: oracledb.OBJECT }).then(function (result) {
        return connection;
    });
}

function resetBookSeatTickets(connection, ticketIds) {
    var sql = 'UPDATE BOOK_SEAT SET TCK_ID = NULL WHERE TCK_ID IN (' + ticketIds.map(function (s, i) {
        return ':' + i;
    }) + ')';
    return connection.execute(sql, ticketIds, { autoCommit: false, outFormat: oracledb.OBJECT }).then(function (result) {
        return connection;
    });
}

function deleteBookSeatByScheduleIdExecute(connection, schedId) {
    return connection.execute('DELETE FROM BOOK_SEAT WHERE SCHED_ID = :SCHED_ID', { SCHED_ID: schedId }, { autoCommit: false }).then(function (result) {
        return connection;
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
    firstBatchInsert: firstBatchInsert,
    findBookSeatByScheduleId: findBookSeatByScheduleId,
    findBookSeatByScheduleIdAndSeatNames: findBookSeatByScheduleIdAndSeatNames,
    updateBookSeatTicketAndBookable: updateBookSeatTicketAndBookable,
    resetBookSeatTicket: resetBookSeatTicket,
    resetBookSeatTickets: resetBookSeatTickets,
    deleteBookSeatByScheduleIdExecute: deleteBookSeatByScheduleIdExecute
};
//# sourceMappingURL=bookSeatService.js.map