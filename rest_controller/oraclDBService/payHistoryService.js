const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');
const ticketService  = require('./ticketService');
const customerService = require('./customerService');
function createPayHistoryExecute(connection, payHistoryObject) {
    const sql = `INSERT INTO PAY_HISTORY 
                (CUST_ID, PAY_DET_CODE, PAY_CL_CODE, POINT_PAY, DISC_PRICE, PAY_PRICE, POINT_SAVE, TCK_ID, DISC_CODE, PAY_DATE) 
                VALUES(:CUST_ID, :PAY_DET_CODE, :PAY_CL_CODE, :POINT_PAY, :DISC_PRICE, :PAY_PRICE, :POINT_SAVE, :TCK_ID, :DISC_CODE, SYSDATE)`
    return connection.execute(sql, {CUST_ID: payHistoryObject.CUST_ID, PAY_DET_CODE: payHistoryObject.PAY_DET_CODE,
        PAY_CL_CODE: payHistoryObject.PAY_CL_CODE, POINT_PAY: payHistoryObject.POINT_PAY, DISC_PRICE: payHistoryObject.DISC_PRICE,
        PAY_PRICE: payHistoryObject.PAY_PRICE, POINT_SAVE: payHistoryObject.POINT_SAVE, TCK_ID: payHistoryObject.TCK_ID,
        DISC_CODE: payHistoryObject.DISC_CODE
    }, {autoCommit: false}).then((result) => connection);
}

function createPayHistory(payHistoryObject) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return createPayHistoryExecute(connection, payHistoryObject);
            }).then((connection) => {
            return ticketService.updateTicketStatusToExecute(connection,payHistoryObject.TCK_ID, 'P');
        }).then((connection) => {
            const result = payHistoryObject.POINT_SAVE - payHistoryObject.POINT_PAY;
            return customerService.updatePointOfUserExecute(connection, payHistoryObject.CUST_ID, result, '+');
        }).then((connection) => {
            connection.commit((error) => {
                if(error) {
                    doRelease(connection);
                    console.log(error);
                    reject(error);
                }
                doRelease(connection);
                resolve('success');
            })
        }).catch((error) => {console.log(error); reject(error)});
    })
}
function createPayHistoryOfNonUser(payHistoryObject) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return createPayHistoryExecute(connection, payHistoryObject);
            }).then((connection) => {
            return ticketService.updateTicketStatusToExecute(connection,payHistoryObject.TCK_ID, 'P');
        }).then((connection) => {
            connection.commit((error) => {
                if(error) {
                    doRelease(connection);
                    console.log(error);
                    reject(error);
                }
                doRelease(connection);
                resolve('success');
            })
        }).catch((error) => {console.log(error); reject(error)});
    })
}
function findPayHistoryByTicketId(ticketId) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute('SELECT * FROM PAY_HISTORY WHERE TCK_ID = :TCK_ID', {TCK_ID: ticketId}, {outFormat: oracledb.OBJECT},
                    (err, result) => {
                        if(err) {
                            doRelease(connection);
                            console.log(err);
                            reject(err);
                        }
                        doRelease(connection);
                        resolve(result.rows);
                    })
            })
    })
}
function findPayHistoryByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                const sql = `SELECT PH.PAY_STATUS, PD.PAY_DET_CODE_NAME , TO_CHAR(PH.PAY_DATE, 'YYYY-MM-DD') AS PAY_DATE, 
                PH.POINT_PAY, PH.POINT_SAVE, DC.DISC_NAME, TP.*
                FROM PAY_HISTORY PH
                JOIN PAY_DETAIL PD ON(PD.PAY_DET_CODE = PH.PAY_DET_CODE)
                JOIN (SELECT T.TCK_ID, T.BOOK_SEAT_CNT,  P.*  FROM TICKET T, PLAY_INFO P WHERE T.SCHED_ID = P.SCHED_ID) TP ON(PH.TCK_ID = TP.TCK_ID)
                LEFT OUTER JOIN DISCOUNT DC ON(PH.DISC_CODE = DC.DISC_CODE)
                WHERE PH.CUST_ID = :CUST_ID ORDER BY PAY_DATE`;
                connection.execute(sql, {CUST_ID: customerId},
                    {outFormat: oracledb.OBJECT},
                    (err, result) => {
                        if(err) {
                            doRelease(connection);
                            reject('error');
                            console.log('error while findPayHistoryByCustomerId', err);
                            return;
                        }
                        console.log(result);
                        doRelease(connection);
                        resolve(result.rows);
                    })
            })
    })
}
function updatePayHistoryStatusExecute(connection, TCK_ID, PAY_STATUS) {
    return connection.execute('UPDATE PAY_HISTORY SET PAY_STATUS = :PAY_STATUS WHERE TCK_ID = :TCK_ID', {PAY_STATUS: PAY_STATUS, TCK_ID: TCK_ID}, {autoCommit:false})
        .then((result) => connection);
}
function refund(payHistoryObject) {
    return new Promise((resolve, reject) => {
        let conn;
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                conn = connection;
                return updatePayHistoryStatusExecute(connection, payHistoryObject.TCK_ID, 'R')
            }).then((connection) => {
            if(payHistoryObject.IS_USER === 'Y') {
                const point = payHistoryObject.POINT_PAY - payHistoryObject.POINT_SAVE;
                return customerService.updatePointOfUserExecute(connection, payHistoryObject.CUST_ID, point, '+');
            }else {
                return connection;
            }
        }).then((connection) => {
            return ticketService.ticketAndBookSeatRefundProcessExecute(connection, payHistoryObject.TCK_ID)
        }).then((connection) => {
            connection.commit((err) => {
                if(err) {
                    doRelease(connection);
                    reject(err);
                    return;
                }
                doRelease(connection);
                resolve('success');
            })
        }).catch((error) => {
            if(conn) {
                doRelease(conn);
            }
            console.log(error)
        });
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
    createPayHistory,
    createPayHistoryOfNonUser,
    findPayHistoryByCustomerId,
    findPayHistoryByTicketId,
    refund
}