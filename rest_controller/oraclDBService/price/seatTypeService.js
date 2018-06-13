const dbConfig = require('../../../config/oracle-db-config');
const oracledb = require('oracledb');
const commonUtil = require('../../../commonModule/commonUtil');

const insertSeatType = (seatTypeObject) => {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute('INSERT INTO SEAT_TYPE VALUES(SEAT_TYPE_SEQ.NEXTVAL, :SEAT_TYPE_NAME, :ADD_COST)',
                    {SEAT_TYPE_NAME: seatTypeObject.SEAT_TYPE_NAME, ADD_COST: seatTypeObject.ADD_COST},
                    {autoCommit: true}, (err, result) => {
                        if(err) {
                            commonUtil.defaultPromiseErrorHandler(err);
                            connection.close();
                            reject(err);
                            return;
                        }
                        resolve('success');
                        connection.close();
                    })
            })
            .catch(commonUtil.defaultPromiseErrorHandler)
    })
}
const findSeatTypeAll = () => {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                    return connection.execute('SELECT * FROM SEAT_TYPE', [], {outFormat: oracledb.OBJECT},
                        (err, result) => {
                        if(err) {
                            commonUtil.defaultPromiseErrorHandler(err);
                            connection.close();
                            reject(err);
                            return;
                        }
                        resolve(result.rows);
                        connection.close();
                    });
                }
            ).catch(commonUtil.defaultPromiseErrorHandler);
    })
}
function findSeatTypeById(id){
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute('SELECT * FROM SEAT_TYPE WHERE SEAT_TYPE_ID = :SEAT_TYPE_ID', id, {outFormat: oracledb.OBJECT},
                    (err, result) => {
                        if(err) {
                            commonUtil.defaultPromiseErrorHandler(err);
                            connection.close();
                            reject(err);
                            return;
                        }
                        resolve(result.rows);
                        connection.close();
                    })

            }).catch(commonUtil.defaultPromiseErrorHandler);
    })
}

module.exports = {
    insertSeatType,
    findSeatTypeAll,
    findSeatTypeById
}