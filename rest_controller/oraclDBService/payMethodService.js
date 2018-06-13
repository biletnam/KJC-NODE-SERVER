const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');


function getPayMethod(){
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `SELECT PC.PAY_CL_CODE, PC.PAY_CL_CODE_NAME, PD.PAY_DET_CODE, PD.PAY_DET_CODE_NAME, PD.PAY_MODULE_NAME FROM PAY_CLASSIFY PC LEFT OUTER JOIN PAY_DETAIL PD ON(PC.PAY_CL_CODE = PD.PAY_CL_CODE)`
                connection.execute(sql,[],{outFormat: oracledb.OBJECT},
                    (err, result) => {
                        if(err) {
                            console.log(err);
                            doRelease(connection);
                            reject(err);
                            return;
                        }
                        doRelease(connection);
                        resolve(result.rows);
                    })

            })
            .catch((error) => console.log(error));
    })
}
function insertPayClassify(codeName) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute('INSERT INTO PAY_CLASSIFY VALUES(PAY_CLASSIFY_SEQ.NEXTVAL, :PAY_CL_CODE_NAME)',{PAY_CL_CODE_NAME: codeName},
                    {outFormat: oracledb.OBJECT, autoCommit: true},
                    (err, result) => {
                        if(err) {
                            console.log(err);
                            doRelease(connection);
                            reject(err);
                            return;
                        }
                        doRelease(connection);
                        resolve('success');
                    })

            })
            .catch((error) => console.log(error));
    })
}
function insertPayDetail(detailObject){
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `INSERT INTO PAY_DETAIL (PAY_DET_CODE, PAY_DET_CODE_NAME, PAY_CL_CODE, PAY_MODULE_NAME)
                VALUES(PAY_DETAIL_SEQ.NEXTVAL,:PAY_DETAIL_CODE_NAME, :PAY_CL_CODE, :PAY_MODULE_NAME)`
                connection.execute(sql,{PAY_DETAIL_CODE_NAME: detailObject.PAY_DETAIL_CODE_NAME, PAY_CL_CODE: detailObject.PAY_CL_CODE,
                    PAY_MODULE_NAME: detailObject.PAY_MODULE_NAME},
                    {outFormat: oracledb.OBJECT, autoCommit: true},
                    (err, result) => {
                        if(err) {
                            console.log(err);
                            doRelease(connection);
                            reject(err);
                            return;
                        }
                        doRelease(connection);
                        resolve('success');
                    })

            })
            .catch((error) => console.log(error));
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
    findMethod: getPayMethod,
    insertPayDetail,
    insertPayClassify
}