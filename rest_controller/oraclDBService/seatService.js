const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');
const commonUtil = require('../../commonModule/commonUtil');

function firstBatchInsert(ROWS, connection) {
    return connection.executeMany('INSERT INTO SEAT VALUES(:SEAT_NAME, :CINEMA_NO, :BRCH_ID, :SEAT_TYPE_ID)',
        ROWS, {autoCommit: false});
}

function findSeatsByCinemaNoAndBranchID(CINEMA_NO, BRCH_ID) {
    return new Promise((resolve, reject) => {
        console.log(CINEMA_NO, BRCH_ID);
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
               return connection.execute('SELECT * FROM SEAT WHERE CINEMA_NO = :CINEMA_NO AND BRCH_ID = :BRCH_ID',
                    {CINEMA_NO: CINEMA_NO, BRCH_ID: BRCH_ID}, {outFormat: oracledb.OBJECT}, (err, result) => {
                        if(err) {
                            console.log('error');
                            doRelease(connection);
                            reject('error');
                            return;
                        }
                        doRelease(connection);
                        resolve(result.rows);
                    })
            }).catch(commonUtil.defaultPromiseErrorHandler);
    })
}

function findSeatsByCNOAndBIDWithSeatType(CINEMA_NO, BRCH_ID) {
    return new Promise((resolve, reject) => {
        console.log(CINEMA_NO, BRCH_ID);
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute('SELECT * FROM SEAT S JOIN SEAT_TYPE ST ON(S.SEAT_TYPE_ID = ST.SEAT_TYPE_ID) WHERE CINEMA_NO = :CINEMA_NO AND BRCH_ID = :BRCH_ID',
                    {CINEMA_NO: CINEMA_NO, BRCH_ID: BRCH_ID}, {outFormat: oracledb.OBJECT}, (err, result) => {
                        if(err) {
                            doRelease(connection);
                            console.log('error');
                            reject('error');
                            return;
                        }
                        doRelease(connection);
                        resolve(result.rows);
                    })
            }).catch(commonUtil.defaultPromiseErrorHandler);
    })
}

function updateSeatsSeatType(seatTypeUpdateObject) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.executeMany(`UPDATE SEAT SET SEAT_TYPE_ID=:SEAT_TYPE_ID WHERE BRCH_ID=:BRCH_ID AND CINEMA_NO = :CINEMA_NO AND SEAT_NAME = :SEAT_NAME`,
                    seatTypeUpdateObject,
                    {autoCommit: false}, (err, result) => {
                        if(err) {
                            console.log('error in seatType', err);
                            doRelease(connection);
                            reject(err);
                            return;
                        }
                        connection.commit((err) => {
                            if(err) {
                                console.log('error in seatType commit', err);
                                doRelease(connection);
                                reject(err);
                                return;
                            }
                            doRelease(connection);
                            resolve('success');
                        })
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
    firstBatchInsert: firstBatchInsert,
    findSeatsByCinemaNoAndBranchID,
    findSeatsByCNOAndBIDWithSeatType,
    updateSeatsSeatType
}