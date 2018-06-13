'use strict';

var dbConfig = require('../../../config/oracle-db-config');
var oracledb = require('oracledb');
var commonUtil = require('../../../commonModule/commonUtil');

var insertSeatType = function insertSeatType(seatTypeObject) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('INSERT INTO SEAT_TYPE VALUES(SEAT_TYPE_SEQ.NEXTVAL, :SEAT_TYPE_NAME, :ADD_COST)', { SEAT_TYPE_NAME: seatTypeObject.SEAT_TYPE_NAME, ADD_COST: seatTypeObject.ADD_COST }, { autoCommit: true }, function (err, result) {
                if (err) {
                    commonUtil.defaultPromiseErrorHandler(err);
                    connection.close();
                    reject(err);
                    return;
                }
                resolve('success');
                connection.close();
            });
        }).catch(commonUtil.defaultPromiseErrorHandler);
    });
};
var findSeatTypeAll = function findSeatTypeAll() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT * FROM SEAT_TYPE', [], { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    commonUtil.defaultPromiseErrorHandler(err);
                    connection.close();
                    reject(err);
                    return;
                }
                resolve(result.rows);
                connection.close();
            });
        }).catch(commonUtil.defaultPromiseErrorHandler);
    });
};
function findSeatTypeById(id) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT * FROM SEAT_TYPE WHERE SEAT_TYPE_ID = :SEAT_TYPE_ID', id, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    commonUtil.defaultPromiseErrorHandler(err);
                    connection.close();
                    reject(err);
                    return;
                }
                resolve(result.rows);
                connection.close();
            });
        }).catch(commonUtil.defaultPromiseErrorHandler);
    });
}

module.exports = {
    insertSeatType: insertSeatType,
    findSeatTypeAll: findSeatTypeAll,
    findSeatTypeById: findSeatTypeById
};
//# sourceMappingURL=seatTypeService.js.map