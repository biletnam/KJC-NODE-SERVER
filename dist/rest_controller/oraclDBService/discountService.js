'use strict';

var dbConfig = require('../../config/oracle-db-config');
var oracledb = require('oracledb');
function insertDiscount(discountObject) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = 'INSERT INTO DISCOUNT (DISC_CODE, DISC_NAME, DISC_METHOD, DISC_AMT)\n                VALUES(DISCOUNT_SEQ.NEXTVAL,:DISC_NAME, :DISC_METHOD, :DISC_AMT)';
            connection.execute(sql, { DISC_NAME: discountObject.DISC_NAME, DISC_METHOD: discountObject.DISC_METHOD,
                DISC_AMT: discountObject.DISC_AMT }, { outFormat: oracledb.OBJECT, autoCommit: true }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject(err);
                    return;
                }
                doRelease(connection);
                resolve('success');
            });
        }).catch(function (error) {
            return console.log(error);
        });
    });
}
function findAll() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            connection.execute('SELECT * FROM DISCOUNT', [], { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (error) {
            console.log(error);
        });
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
    insertDiscount: insertDiscount,
    findAll: findAll
};
//# sourceMappingURL=discountService.js.map