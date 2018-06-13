'use strict';

var dbConfig = require('../../config/oracle-db-config');
var oracledb = require('oracledb');
var commonUtil = require('../../commonModule/commonUtil');
var insertBranch = function insertBranch(branchObject) {
    return new Promise(function (resolve, reject) {
        var conn = void 0;
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            conn = connection;
            return connection.execute('INSERT INTO BRANCH VALUES(BRANCH_SEQ.NEXTVAL, :BRANCH_NAME, :ZIP_CODE, :ADDR, :ADDR_DET)', {
                BRANCH_NAME: branchObject.BRANCH_NAME,
                ZIP_CODE: branchObject.ZIP_CODE,
                ADDR: branchObject.ADDR,
                ADDR_DET: branchObject.ADDR_DET
            }, { autoCommit: true }, function (err, result) {
                if (err) {
                    doRelease(connection);
                    reject('error');
                    commonUtil.addPrefixErrorHandler(err, 'errorWhileInsert');
                    return;
                }
                doRelease(connection);
                resolve('success');
            });
        }).catch(function (error) {
            return commonUtil.addPrefixErrorHandler(error, 'error while connection');
        });
    });
};
var findAllBranch = function findAllBranch() {
    return new Promise(function (resolve, reject) {
        var conn = void 0;
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            conn = connection;
            return connection.execute('SELECT * FROM BRANCH', [], { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    commonUtil.addPrefixErrorHandler(err, 'error while select');
                    doRelease(connection);
                    reject('err');
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (err) {
            return commonUtil.addPrefixErrorHandler(err, 'while connection error');
        });
    });
};
var findBranchById = function findBranchById(id) {
    return new Promise(function (resolve, reject) {
        var conn = void 0;
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            conn = connection;
            return connection.execute('SELECT * FROM BRANCH WHERE BRCH_ID = :BRCH_ID', { BRCH_ID: id }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    commonUtil.addPrefixErrorHandler(err, 'error while select');
                    doRelease(connection);
                    reject('err');
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (err) {
            return commonUtil.addPrefixErrorHandler(err, 'while connection error');
        });
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
    insertBranch: insertBranch,
    findAllBranch: findAllBranch,
    findBranchById: findBranchById
};
//# sourceMappingURL=branchService.js.map