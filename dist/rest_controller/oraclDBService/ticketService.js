'use strict';

var dbConfig = require('../../config/oracle-db-config');
var oracledb = require('oracledb');
var commonUtil = require('../../commonModule/commonUtil');
var bookSeatService = require('./bookSeatService');

function insertTicket(connection, ticketObject) {
    var sql = 'INSERT INTO TICKET \n                (TCK_ID, CUST_ID, BOOK_DATE, TCK_PRICE, BOOK_SEAT_CNT, SCHED_ID, SEAT_NAME)\n                VALUES (TICKET_SEQ.NEXTVAL, :CUST_ID, SYSDATE, :TCK_PRICE, :BOOK_SEAT_CNT, :SCHED_ID, :SEAT_NAME) RETURNING TCK_ID INTO :tck_id';
    return connection.execute(sql, { CUST_ID: ticketObject.CUST_ID, TCK_PRICE: ticketObject.TCK_PRICE,
        BOOK_SEAT_CNT: ticketObject.BOOK_SEAT_CNT, SCHED_ID: ticketObject.SCHED_ID, SEAT_NAME: ticketObject.SEAT_NAME, tck_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }, { autoCommit: false });
}
function deleteTicketById(connection, ticketId) {
    return connection.execute('DELETE FROM TICKET WHERE TCK_ID = :TCK_ID', { TCK_ID: ticketId }, { autoCommit: false }).then(function (result) {
        return connection;
    });
}
function resetBookAndTicket(ticketId) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            console.log('here');
            return bookSeatService.resetBookSeatTicket(connection, ticketId);
        }).then(function (connection) {
            console.log('we are here');
            return deleteTicketById(connection, ticketId);
        }).then(function (connection) {
            connection.commit(function (err) {
                if (err) {
                    doRelease(connection);
                    reject(err);
                    throw err;
                }
                doRelease(connection);
                resolve('success');
            });
        });
    });
}
function checkAndResetTicket(ticketId) {
    return new Promise(function (resolve, reject) {
        findTicketById(ticketId).then(function (data) {
            var tckStatus = data[0].TCK_STATUS;
            console.log(tckStatus);
            console.log('they are here to delete Ticket');

            if (!tckStatus || tckStatus !== 'C') {
                reject("this Ticket can't be deleted");
                return true;
            } else {
                resetBookAndTicket(ticketId).then(function (data) {
                    resolve(data);
                }).catch(function (error) {
                    reject(error);
                });
            }
        }).catch(function (error) {
            console.log(error);
        });
    });
}
function findTicketById(ticketId) {
    return new Promise(function (resolve, reject) {
        console.log(ticketId);
        console.log(new Date());
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            connection.execute('SELECT TCK_ID, TCK_STATUS, TO_CHAR(BOOK_DATE, \'YYYY-MM-DD"T"HH24:MI\') AS BOOK_DATE, TCK_PRICE, BOOK_SEAT_CNT, SCHED_ID, SEAT_NAME FROM TICKET WHERE TCK_ID = :TCK_ID', { TCK_ID: ticketId }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject(err);
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        });
    });
}
function createTicket(ticketObject) {
    var gConn = void 0;
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return insertTicket(connection, ticketObject).then(function (result) {
                gConn = connection;
                var TCK_ID = result.outBinds.tck_id[0];
                if (!TCK_ID) {
                    doRelease(connection);
                    reject('error');
                    throw 'error';
                }
                setTimeout(function () {
                    checkAndResetTicket(TCK_ID);
                }, 190000);
                return { connection: connection, TCK_ID: TCK_ID };
            }).then(function (connectionObject) {
                var conn = connectionObject.connection;
                return bookSeatService.updateBookSeatTicketAndBookable(conn, connectionObject.TCK_ID, ticketObject);
            }).then(function (connection) {
                connection.commit(function (error) {
                    if (error) {
                        doRelease(connection);
                        reject(error);
                        throw 'error';
                    }
                    doRelease(connection);
                    resolve('success');
                });
            }).catch(function (error) {
                if (gConn) {
                    doRelease(gConn);console.log(error);
                }
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
    createTicket: createTicket,
    findTicketById: findTicketById,
    checkAndResetTicket: checkAndResetTicket
};
//# sourceMappingURL=ticketService.js.map