const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');
const commonUtil = require('../../commonModule/commonUtil');

const playTypeService = require('./price/playTypeService');
const seatService = require('./seatService');

function firstBatchInsert(connection, scheduleObject) {
    const playTypeP = playTypeService.findPlayTypeById(scheduleObject.PT_ID);
    const seatsP = seatService.findSeatsByCNOAndBIDWithSeatType(scheduleObject.CINEMA_NO, scheduleObject.BRCH_ID);
    return Promise.all([playTypeP, seatsP])
        .then((values) => {
            const playType = values[0][0];
            const seats = values[1];
            const bookSeatObjectArray = seats.map((s) => {
                return {SEAT_NAME: s.SEAT_NAME, BOOK_PRICE:playType.PT_PRICE + s.ADD_COST, CINEMA_NO: scheduleObject.CINEMA_NO, BRCH_ID: scheduleObject.BRCH_ID }
            })
            console.log(bookSeatObjectArray);
            return connection.executeMany(`INSERT INTO BOOK_SEAT (SCHED_ID, SEAT_NAME, BOOK_PRICE, CINEMA_NO, BRCH_ID)
            VALUES(SCHEDULE_SEQ.CURRVAL, :SEAT_NAME, :BOOK_PRICE, :CINEMA_NO, :BRCH_ID)`, bookSeatObjectArray, {autoCommit: false}).then((result) => connection)
        })
}
function findBookSeatByScheduleId(SCHED_ID) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute('SELECT * FROM BOOK_SEAT WHERE SCHED_ID = :SCHED_ID', {SCHED_ID: Number(SCHED_ID)}, {outFormat: oracledb.OBJECT},
                    (err, result) => {
                        if(err) {
                            console.log('error while select', err);
                            doRelease(connection);
                            reject('error');
                            return;
                        }
                        doRelease(connection);
                        resolve(result.rows);
                    })
            }).catch((error) => console.log(error));
    })
}

function findBookSeatByScheduleIdAndSeatNames(scheduleId, seatNames) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `SELECT * FROM BOOK_SEAT WHERE SCHED_ID = ${scheduleId} AND SEAT_NAME IN (${seatNames.map((s,i) => ':'+i).join(', ')})`;
                connection.execute(sql, seatNames, {outFormat: oracledb.OBJECT},
                    (err, result) => {
                        if(err) {
                            console.log('error while select', err);
                            doRelease(connection);
                            reject('error');
                            return;
                        }
                        doRelease(connection);
                        resolve(result.rows);
                    })
            }).catch((error) => console.log(error));
    })
}
function updateBookSeatTicketAndBookable(connection,ticketId, ticketObject) {
    const scheduleId = ticketObject.SCHED_ID;
    const seatNames = ticketObject.seatNames;
    const sql = `UPDATE BOOK_SEAT SET TCK_ID=${ticketId} WHERE SCHED_ID = ${scheduleId} AND SEAT_NAME IN(${seatNames.map((s,i) => ':'+i).join(', ')})`;
    return connection.execute(sql, seatNames, {autoCommit: false, outFormat: oracledb.OBJECT}).then((result) => connection);
}

function resetBookSeatTicket(connection,ticketId) {
    const sql = `UPDATE BOOK_SEAT SET TCK_ID = NULL WHERE TCK_ID = ${ticketId}`;
    console.log(sql);
    return connection.execute(sql,[], {autoCommit: false, outFormat: oracledb.OBJECT}).then((result) => connection);
}

function deleteBookSeatByScheduleIdExecute(connection, schedId) {
    return connection.execute('DELETE FROM BOOK_SEAT WHERE SCHED_ID = :SCHED_ID',{SCHED_ID: schedId}, {autoCommit: false})
        .then((result) => connection);
}
function doRelease(connection) {
    return connection.close((err) => {
        if(err) {
            console.log(err);
        }
    })
}

module.exports = {
    firstBatchInsert,
    findBookSeatByScheduleId,
    findBookSeatByScheduleIdAndSeatNames : findBookSeatByScheduleIdAndSeatNames,
    updateBookSeatTicketAndBookable,
    resetBookSeatTicket,
    deleteBookSeatByScheduleIdExecute
}