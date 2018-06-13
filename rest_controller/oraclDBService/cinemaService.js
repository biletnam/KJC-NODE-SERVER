const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');
const commonUtil = require('../../commonModule/commonUtil');
const seatService = require('./seatService');
class SeatMaker{
    constructor() {
        this.seatRowWrapper = {
            1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G', 8: 'F', 9: 'I',
            10: 'J', 11: 'K', 12: 'L', 13: 'M', 14: 'N', 15: 'O', 16: 'P', 17: 'Q', 18: 'R',
            19: 'S', 20: 'T', 21: 'U', 22: 'V', 23: 'W', 24: 'X', 25: 'Y', 26: 'Z'};
    }
    makeSeatNamesByRows(rows) {
        const seatNames = [];
        rows.map((r) => {
            const rowName = this.seatRowWrapper[Number(r.id)];
            for(let i = 1; i <= Number(r.column); i++) {
                const c = (i < 10) ? '0'+ i : ''+i;
                const seatName = rowName+c;
                seatNames.push(seatName);
            }
        })
        return seatNames;
    }
     makeSeatObject(seatName, cinemaObject) {
        return {SEAT_NAME: seatName, CINEMA_NO: cinemaObject.CINEMA_NO,
            BRCH_ID: cinemaObject.BRCH_ID, SEAT_TYPE_ID: cinemaObject.SEAT_TYPE_ID};
    }
     makeSeatObjectArray(rows, cinemaObject) {
         const seatNames = this.makeSeatNamesByRows(rows);
         console.log(seatNames);
         const seatObjectArray = seatNames.map((s) => {
             return this.makeSeatObject(s, cinemaObject);
         })
        return seatObjectArray;
    }
}
function insertCinema(cinemaObject){
    const rows = cinemaObject.rows;
    const seatMaker = new SeatMaker();
    const seatObjectArray = seatMaker.makeSeatObjectArray(rows, cinemaObject);
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute('INSERT INTO CINEMA VALUES(:CINEMA_NO, :BRCH_ID, :SEAT_CNT, :FLOOR)',
                    {CINEMA_NO: cinemaObject.CINEMA_NO, BRCH_ID: cinemaObject.BRCH_ID, SEAT_CNT: seatObjectArray.length, FLOOR: cinemaObject.FLOOR},
                    {autoCommit: false})
                    .then(() => connection)
            }).then((connection) => {
            console.log('we are groot');
            return seatService.firstBatchInsert(seatObjectArray, connection)
                .then((result) => {
                    connection.commit((err) => {
                        if(err) {
                            console.log('error while commit');
                            reject(err);
                            doRelease(connection);
                            return;
                        }
                        doRelease(connection);
                        resolve('success');
                    })
                })
        }).catch((error) => {reject(error); console.log(error);});
    })
}
function findAll() {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute('SELECT * FROM CINEMA', [], {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err) {
                        console.log('error while select', err);
                        doRelease(connection);
                        reject(err);
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            }).catch((error) => {console.log('catch error outside')});
    })
}
function findCinemaByCinemaNoAndBranchId(CINEMA_NO, BRCH_ID) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute('SELECT * FROM CINEMA WHERE CINEMA_NO = :CINEMA_NO AND BRCH_ID = :BRCH_ID',
                    {CINEMA_NO: CINEMA_NO, BRCH_ID: BRCH_ID}
                    , {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err) {
                        console.log('error while select', err);
                        doRelease(connection);
                        reject(err);
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            }).catch((error) => {console.log('catch error outside')});
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
    insertCinema: insertCinema,
    findAll: findAll,
    findCinemaByCinemaNoAndBranchId
}