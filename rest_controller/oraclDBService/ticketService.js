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
    });
}
function findTicketById(ticketId) {
    return new Promise((resolve, reject) => {
        console.log(ticketId);
        console.log(new Date());
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute(`SELECT TCK_ID, TCK_STATUS, TO_CHAR(BOOK_DATE, 'YYYY-MM-DD"T"HH24:MI') AS BOOK_DATE, TCK_PRICE, BOOK_SEAT_CNT, SCHED_ID, SEAT_NAME FROM TICKET WHERE TCK_ID = :TCK_ID`, {TCK_ID: ticketId}, {outFormat: oracledb.OBJECT},
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
                    return {connection: connection, TCK_ID: TCK_ID}
                }).then((connectionObject) => {
                    const conn = connectionObject.connection;
                    return bookSeatService.updateBookSeatTicketAndBookable(conn, connectionObject.TCK_ID, ticketObject);
                }).then((connection) => {
                    connection.commit((error) => {
                        if(error) {
                            doRelease(connection);
                            reject(error);
                            throw 'error';
                        }
                        doRelease(connection);
                        resolve('success');
                    })
                }).catch((error) => {if(gConn) { doRelease(gConn); console.log(error)}});
            })
            .catch((error) => {console.log(error);});
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
    checkAndResetTicket
}