const dbConfig = require('../../../config/oracle-db-config');
const oracledb = require('oracledb');
const commonUtil = require('../../../commonModule/commonUtil');

const insertPlayType = (playTypeObject) => {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute('INSERT INTO PLAY_TYPE VALUES(PLAY_TYPE_SEQ.NEXTVAL, :PT_NAME, :PT_PRICE)',
                    {PT_NAME: playTypeObject.PT_NAME, PT_PRICE: playTypeObject.PT_PRICE},
                    {autoCommit: true}, (err, result) => {
                        if(err) {
                            doRelease(connection);
                            commonUtil.defaultPromiseErrorHandler(err);
                            reject(err);
                        }
                        doRelease(connection);
                        resolve('success');
                    })
            }).catch(commonUtil.defaultPromiseErrorHandler)
    })
}
const findPlayTypeAll = () => {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                    return connection.execute('SELECT * FROM PLAY_TYPE', [], {outFormat: oracledb.OBJECT},
                        (err, result) => {
                            if(err) {
                                commonUtil.defaultPromiseErrorHandler(err);
                                doRelease(connection);
                                reject(err);
                                return;
                            }
                            doRelease(connection);
                            resolve(result.rows);
                        });
                }
            ).catch(commonUtil.defaultPromiseErrorHandler);
    })
}
const findPlayTypeById = (id) => {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                    return connection.execute('SELECT * FROM PLAY_TYPE WHERE PT_ID = :PT_ID', {PT_ID: id}, {outFormat: oracledb.OBJECT},
                        (err, result) => {
                            if(err) {
                                commonUtil.defaultPromiseErrorHandler(err);
                                doRelease(connection);
                                reject(err);
                                return;
                            }
                            doRelease(connection);
                            resolve(result.rows);
                        });
                }
            ).catch(commonUtil.defaultPromiseErrorHandler);
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
    insertPlayType,
    findPlayTypeAll,
    findPlayTypeById
}