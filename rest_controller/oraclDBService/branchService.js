const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');
const commonUtil = require('../../commonModule/commonUtil');
const insertBranch = (branchObject) => {
    return new Promise((resolve, reject) => {
        let conn;
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                conn = connection;
                return connection.execute('INSERT INTO BRANCH VALUES(BRANCH_SEQ.NEXTVAL, :BRANCH_NAME, :ZIP_CODE, :ADDR, :ADDR_DET)',
                    {
                        BRANCH_NAME: branchObject.BRANCH_NAME,
                        ZIP_CODE: branchObject.ZIP_CODE,
                        ADDR: branchObject.ADDR,
                        ADDR_DET: branchObject.ADDR_DET
                    }, {autoCommit: true}, (err, result) => {
                        if (err) {
                            doRelease(connection);
                            reject('error');
                            commonUtil.addPrefixErrorHandler(err, 'errorWhileInsert');
                            return;
                        }
                        doRelease(connection);
                        resolve('success');
                    })
        }).catch((error) => commonUtil.addPrefixErrorHandler(error, 'error while connection'));
    });
}
const findAllBranch = () => {
    return new Promise((resolve, reject) => {
        let conn;
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                conn = connection;
                return connection.execute('SELECT * FROM BRANCH', [], {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err) {
                        commonUtil.addPrefixErrorHandler(err, 'error while select');
                        doRelease(connection);
                        reject('err');
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            }).catch((err) => commonUtil.addPrefixErrorHandler(err, 'while connection error'));
    });
}
const findBranchById = (id) => {
    return new Promise((resolve, reject) => {
        let conn;
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                conn = connection;
                return connection.execute('SELECT * FROM BRANCH WHERE BRCH_ID = :BRCH_ID', {BRCH_ID: id}, {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err) {
                        commonUtil.addPrefixErrorHandler(err, 'error while select');
                        doRelease(connection);
                        reject('err');
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            }).catch((err) => commonUtil.addPrefixErrorHandler(err, 'while connection error'));
    });
}


function doRelease(connection) {
    return connection.close((err) => {
        if(err) {
            console.log(err);
        }
    })
}

module.exports = {
    insertBranch,
    findAllBranch,
    findBranchById
}