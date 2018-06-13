'use strict';

var dbConfig = require('../../../config/oracle-db-config');
var oracledb = require('oracledb');
var commonUtil = require('../../../commonModule/commonUtil');

var insertPlayType = function insertPlayType(playTypeObject) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('INSERT INTO PLAY_TYPE VALUES(PLAY_TYPE_SEQ.NEXTVAL, :PT_NAME, :PT_PRICE)', { PT_NAME: playTypeObject.PT_NAME, PT_PRICE: playTypeObject.PT_PRICE }, { autoCommit: true }, function (err, result) {
                if (err) {
                    doRelease(connection);
                    commonUtil.defaultPromiseErrorHandler(err);
                    reject(err);
                }
                doRelease(connection);
                resolve('success');
            });
        }).catch(commonUtil.defaultPromiseErrorHandler);
    });
};
var findPlayTypeAll = function findPlayTypeAll() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT * FROM PLAY_TYPE', [], { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    commonUtil.defaultPromiseErrorHandler(err);
                    doRelease(connection);
                    reject(err);
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(commonUtil.defaultPromiseErrorHandler);
    });
};
var findPlayTypeById = function findPlayTypeById(id) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT * FROM PLAY_TYPE WHERE PT_ID = :PT_ID', { PT_ID: id }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    commonUtil.defaultPromiseErrorHandler(err);
                    doRelease(connection);
                    reject(err);
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(commonUtil.defaultPromiseErrorHandler);
    });
};
function doRelease(connection) {
    return connection.close(function (err) {
        if (err) {
            console.log(err);
        }
    });
}
module.exports = {
    insertPlayType: insertPlayType,
    findPlayTypeAll: findPlayTypeAll,
    findPlayTypeById: findPlayTypeById
};
//# sourceMappingURL=playTypeService.js.map