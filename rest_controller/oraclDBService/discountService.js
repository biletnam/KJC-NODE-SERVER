const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');
function insertDiscount(discountObject){
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `INSERT INTO DISCOUNT (DISC_CODE, DISC_NAME, DISC_METHOD, DISC_AMT)
                VALUES(DISCOUNT_SEQ.NEXTVAL,:DISC_NAME, :DISC_METHOD, :DISC_AMT)`
                connection.execute(sql,{DISC_NAME: discountObject.DISC_NAME, DISC_METHOD: discountObject.DISC_METHOD,
                        DISC_AMT: discountObject.DISC_AMT},
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
function findAll() {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute('SELECT * FROM DISCOUNT', [], {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err){
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            }).catch((error) => {
            console.log(error);
        })
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
    insertDiscount,
    findAll
}