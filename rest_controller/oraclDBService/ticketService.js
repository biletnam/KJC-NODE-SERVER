const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');
const commonUtil = require('../../commonModule/commonUtil');
const bookSeatService = require('./bookSeatService');

function insertTicket(connection, ticketObject) {
    const sql = `INSERT INTO TICKET 
                (TCK_ID, CUST_ID, BOOK_DATE, TCK_PRICE, BOOK_SEAT_CNT, SCHED_ID, SEAT_NAME)
                VALUES (TICKET_SEQ.NEXTVAL, :CUST_ID, SYSDATE, :TCK_PRICE, :BOOK_SEAT_CNT, :SCHED_ID, :SEAT_NAME) RETURNING TCK_ID INTO :tck_id`
    return connection.execute(sql, {CUST_ID: ticketObject.CUST_ID, TCK_PRICE: ticketObject.TCK_PRICE,
            BOOK_SEAT_CNT: ticketObject.BOOK_SEAT_CNT, SCHED_ID: ticketObject.SCHED_ID, SEAT_NAME: ticketObject.SEAT_NAME, tck_id: {type: oracledb.NUMBER, dir: oracledb.BIND_OUT} }, {autoCommit: false})
}
function deleteTicketById(connection, ticketId) {
    return connection.execute('DELETE FROM TICKET WHERE TCK_ID = :TCK_ID', {TCK_ID: ticketId}, {autoCommit: false}).then((result) => connection)
}
function deleteTicketByIds(connection, ticketIds) {
    const sql = `DELETE FROM TICKET WHERE TCK_ID IN (${ticketIds.map((s,i) => ':'+i).join(', ')})`;
    return connection.execute(sql, ticketIds, {autoCommit: false}).then((result) => connection)
}
function resetBookAndTicket(ticketId) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                console.log('here');
                return bookSeatService.resetBookSeatTicket(connection, ticketId);
            }).then((connection) => {
            console.log('we are here');
            return deleteTicketById(connection, ticketId);
        }).then((connection)=> {
            connection.commit((err) => {
                if(err) {
                    doRelease(connection);
                    reject(err);
                    throw err;
                }
                doRelease(connection);
                resolve('success');
            })
        });
    })
}
function checkAndResetTicket(ticketId){
    return new Promise((resolve, reject) => {
        findTicketById(ticketId)
            .then((data) => {
                const tckStatus = data[0].TCK_STATUS;
                console.log(tckStatus);
                console.log('they are here to delete Ticket');

                if(!tckStatus || tckStatus !=='C') {
                    reject("this Ticket can't be deleted");
                    return true;
                } else {
                    resetBookAndTicket(ticketId)
                        .then((data) => {
                            resolve(data);
                        }).catch((error) => {
                        reject(error);
                    });
                }
            }).catch((error) => {console.log(error);});
    }).catch((error) => console.log(error));
}
function findCStatusTicketForSystem() {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute(`SELECT * FROM TICKET WHERE TCK_STATUS = 'C'`, [], {outFormat: oracledb.OBJECT},
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
    })
}
function resetBookAndTickets(ticketIds) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                console.log('here');
                return bookSeatService.resetBookSeatTickets(connection, ticketIds);
            }).then((connection) => {
            console.log('we are here');
            return deleteTicketByIds(connection, ticketIds);
        }).then((connection)=> {
            connection.commit((err) => {
                if(err) {
                    doRelease(connection);
                    reject(err);
                    throw err;
                }
                doRelease(connection);
                resolve('success');
            })
        }).catch((error) => console.log(error));
    })
}
function checkAndResetTicketAfterMinute(minute){
    return new Promise((resolve, reject) => {
        findCStatusTicketForSystem()
            .then((data) => {
                const now = new Date();
                const needToDeleteTicketIds = data.filter((d) => { return (now.getTime() - d.BOOK_DATE.getTime()) > minute * 60 * 1000})
                                            .map((d) => (d.TCK_ID));
                if(needToDeleteTicketIds.length > 0) {
                    resetBookAndTickets(needToDeleteTicketIds)
                        .then((data) => {
                            resolve(data);
                        }).catch((error) => {
                        reject(error);
                    });
                }else {
                    reject('none');
                }
            }).catch((error) => {console.log(error);});
    });
}
function findTicketById(ticketId) {
    return new Promise((resolve, reject) => {
        console.log(ticketId);
        console.log(new Date());
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute(`SELECT CUST_ID, TCK_ID, TCK_STATUS, TO_CHAR(BOOK_DATE, 'YYYY-MM-DD"T"HH24:MI') AS BOOK_DATE, TCK_PRICE, BOOK_SEAT_CNT, SCHED_ID, SEAT_NAME FROM TICKET WHERE TCK_ID = :TCK_ID`, {TCK_ID: ticketId}, {outFormat: oracledb.OBJECT},
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
    })
}
function createTicket(ticketObject) {
    let gConn;
    return new Promise((resolve, reject) => {
        let ticketId;
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return insertTicket(connection, ticketObject).then((result) => {
                    gConn = connection;
                    const TCK_ID = result.outBinds.tck_id[0];
                    if(!TCK_ID) {
                        doRelease(connection);
                        reject('error');
                        throw 'error';
                    }
                    setTimeout(() => {checkAndResetTicket(TCK_ID)}, 190000);
                    ticketId = TCK_ID;
                    console.log('' + ticketId);
                    return connection
                }).then((connection) => {
                    console.log(ticketId);
                    return bookSeatService.updateBookSeatTicketAndBookable(connection, ticketId, ticketObject);
                }).then((connection) => {
                    connection.commit((error) => {
                        if(error) {
                            doRelease(connection);
                            reject(error);
                            throw 'error';
                        }
                        doRelease(connection);
                        console.log(ticketId);
                        resolve(ticketId);
                    })
                }).catch((error) => {if(gConn) { doRelease(gConn); console.log(error)}});
            })
            .catch((error) => {console.log(error);});
    })
}
function updateTicketStatusToExecute(connection, ticketId, status) {
    return connection.execute(`UPDATE TICKET SET TCK_STATUS = :TCK_STATUS WHERE TCK_ID = :TCK_ID`, {TCK_STATUS: status, TCK_ID: ticketId}, {outFormat: oracledb.OBJECT, autoCommit: false})
        .then((result) => connection);
}
function updateTicketTo(ticketId, status) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute(`UPDATE TICKET SET TCK_STATUS = :TCK_STATUS WHERE TCK_ID = :TCK_ID`, {TCK_STATUS: status, TCK_ID: ticketId}, {outFormat: oracledb.OBJECT, autoCommit: false},
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
    })
}
function findMeaningTicketByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                console.log(customerId);
                connection.execute(`SELECT T.TCK_ID, T.TCK_STATUS, TO_CHAR(T.BOOK_DATE, 'YYYY-MM-DD"T"HH24:MI') AS BOOK_DATE,
                  T.SEAT_NAME, P.FLOOR, P.BRCH_NAME,
                  TO_CHAR(P.PL_START_TIME, 'YYYY-MM-DD"T"HH24:MI') AS PL_START_TIME,
                  TO_CHAR(P.PL_END_TIME, 'YYYY-MM-DD"T"HH24:MI') AS PL_END_TIME,
                  P.CINEMA_NO, P.MOVIE_NAME, P.PT_NAME
                  FROM TICKET T JOIN PLAY_INFO P ON(T.SCHED_ID = P.SCHED_ID) WHERE T.CUST_ID = :CUST_ID AND T.TCK_STATUS != 'C'
                  ORDER BY T.BOOK_DATE`, {CUST_ID: Number(customerId)}, {outFormat: oracledb.OBJECT},
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
    })
}
function ticketAndBookSeatRefundProcessExecute(connection, TCK_ID) {
    return connection.execute(`UPDATE TICKET SET TCK_STATUS = 'R' WHERE TCK_ID = :TCK_ID`, {TCK_ID: TCK_ID}, {autoCommit: false})
        .then((result) => connection)
        .then((connection) => {
            return bookSeatService.resetBookSeatTicket(connection, TCK_ID);
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
    createTicket,
    findTicketById,
    checkAndResetTicket,
    checkAndResetTicketAfterMinute,
    updateTicketStatusToExecute,
    findMeaningTicketByCustomerId,
    ticketAndBookSeatRefundProcessExecute
}