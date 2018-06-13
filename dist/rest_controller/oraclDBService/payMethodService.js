'use strict';

var dbConfig = require('../../config/oracle-db-config');
var oracledb = require('oracledb');

function getPayMethod() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = 'SELECT PC.PAY_CL_CODE, PC.PAY_CL_CODE_NAME, PD.PAY_DET_CODE, PD.PAY_DET_CODE_NAME, PD.PAY_MODULE_NAME FROM PAY_CLASSIFY PC LEFT OUTER JOIN PAY_DETAIL PD ON(PC.PAY_CL_CODE = PD.PAY_CL_CODE)';
            connection.execute(sql, [], { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject(err);
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (error) {
            return console.log(error);
        });
    });
}
function insertPayClassify(codeName) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            connection.execute('INSERT INTO PAY_CLASSIFY VALUES(PAY_CLASSIFY_SEQ.NEXTVAL, :PAY_CL_CODE_NAME)', { PAY_CL_CODE_NAME: codeName }, { outFormat: oracledb.OBJECT, autoCommit: true }, function (err, result) {
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
function insertPayDetail(detailObject) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = 'INSERT INTO PAY_DETAIL (PAY_DET_CODE, PAY_DET_CODE_NAME, PAY_CL_CODE, PAY_MODULE_NAME)\n                VALUES(PAY_DETAIL_SEQ.NEXTVAL,:PAY_DETAIL_CODE_NAME, :PAY_CL_CODE, :PAY_MODULE_NAME)';
            connection.execute(sql, { PAY_DETAIL_CODE_NAME: detailObject.PAY_DETAIL_CODE_NAME, PAY_CL_CODE: detailObject.PAY_CL_CODE,
                PAY_MODULE_NAME: detailObject.PAY_MODULE_NAME }, { outFormat: oracledb.OBJECT, autoCommit: true }, function (err, result) {
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

function doRelease(connection) {
    return connection.close(function (err) {
        if (err) {
            console.log(err);
        }
    });
}

module.exports = {
    findMethod: getPayMethod,
    insertPayDetail: insertPayDetail,
    insertPayClassify: insertPayClassify
};
//# sourceMappingURL=payMethodService.js.map