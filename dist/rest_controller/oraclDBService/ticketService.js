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
function deleteTicketByIds(connection, ticketIds) {
    var sql = 'DELETE FROM TICKET WHERE TCK_ID IN (' + ticketIds.map(function (s, i) {
        return ':' + i;
    }).join(', ') + ')';
    return connection.execute(sql, ticketIds, { autoCommit: false }).then(function (result) {
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
    }).catch(function (error) {
        return console.log(error);
    });
}
function findCStatusTicketForSystem() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            connection.execute('SELECT * FROM TICKET WHERE TCK_STATUS = \'C\'', [], { outFormat: oracledb.OBJECT }, function (err, result) {
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
function resetBookAndTickets(ticketIds) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            console.log('here');
            return bookSeatService.resetBookSeatTickets(connection, ticketIds);
        }).then(function (connection) {
            console.log('we are here');
            return deleteTicketByIds(connection, ticketIds);
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
        }).catch(function (error) {
            return console.log(error);
        });
    });
}
function checkAndResetTicketAfterMinute(minute) {
    return new Promise(function (resolve, reject) {
        findCStatusTicketForSystem().then(function (data) {
            var now = new Date();
            var needToDeleteTicketIds = data.filter(function (d) {
                return now.getTime() - d.BOOK_DATE.getTime() > minute * 60 * 1000;
            }).map(function (d) {
                return d.TCK_ID;
            });
            if (needToDeleteTicketIds.length > 0) {
                resetBookAndTickets(needToDeleteTicketIds).then(function (data) {
                    resolve(data);
                }).catch(function (error) {
                    reject(error);
                });
            } else {
                reject('none');
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
            connection.execute('SELECT CUST_ID, TCK_ID, TCK_STATUS, TO_CHAR(BOOK_DATE, \'YYYY-MM-DD"T"HH24:MI\') AS BOOK_DATE, TCK_PRICE, BOOK_SEAT_CNT, SCHED_ID, SEAT_NAME FROM TICKET WHERE TCK_ID = :TCK_ID', { TCK_ID: ticketId }, { outFormat: oracledb.OBJECT }, function (err, result) {
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
        var ticketId = void 0;
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
                ticketId = TCK_ID;
                console.log('' + ticketId);
                return connection;
            }).then(function (connection) {
                console.log(ticketId);
                return bookSeatService.updateBookSeatTicketAndBookable(connection, ticketId, ticketObject);
            }).then(function (connection) {
                connection.commit(function (error) {
                    if (error) {
                        doRelease(connection);
                        reject(error);
                        throw 'error';
                    }
                    doRelease(connection);
                    console.log(ticketId);
                    resolve(ticketId);
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
function updateTicketStatusToExecute(connection, ticketId, status) {
    return connection.execute('UPDATE TICKET SET TCK_STATUS = :TCK_STATUS WHERE TCK_ID = :TCK_ID', { TCK_STATUS: status, TCK_ID: ticketId }, { outFormat: oracledb.OBJECT, autoCommit: false }).then(function (result) {
        return connection;
    });
}
function updateTicketTo(ticketId, status) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            connection.execute('UPDATE TICKET SET TCK_STATUS = :TCK_STATUS WHERE TCK_ID = :TCK_ID', { TCK_STATUS: status, TCK_ID: ticketId }, { outFormat: oracledb.OBJECT, autoCommit: true }, function (err, result) {
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
function findMeaningTicketByCustomerId(customerId) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            console.log(customerId);
            connection.execute('SELECT T.TCK_ID, T.TCK_STATUS, TO_CHAR(T.BOOK_DATE, \'YYYY-MM-DD"T"HH24:MI\') AS BOOK_DATE,\n                  T.SEAT_NAME, P.FLOOR, P.BRCH_NAME,\n                  TO_CHAR(P.PL_START_TIME, \'YYYY-MM-DD"T"HH24:MI\') AS PL_START_TIME,\n                  TO_CHAR(P.PL_END_TIME, \'YYYY-MM-DD"T"HH24:MI\') AS PL_END_TIME,\n                  P.CINEMA_NO, P.MOVIE_NAME, P.PT_NAME\n                  FROM TICKET T JOIN PLAY_INFO P ON(T.SCHED_ID = P.SCHED_ID) WHERE T.CUST_ID = :CUST_ID AND T.TCK_STATUS != \'C\'\n                  ORDER BY T.BOOK_DATE', { CUST_ID: Number(customerId) }, { outFormat: oracledb.OBJECT }, function (err, result) {
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
function ticketAndBookSeatRefundProcessExecute(connection, TCK_ID) {
    return connection.execute('UPDATE TICKET SET TCK_STATUS = \'R\' WHERE TCK_ID = :TCK_ID', { TCK_ID: TCK_ID }, { autoCommit: false }).then(function (result) {
        return connection;
    }).then(function (connection) {
        return bookSeatService.resetBookSeatTicket(connection, TCK_ID);
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
    checkAndResetTicket: checkAndResetTicket,
    checkAndResetTicketAfterMinute: checkAndResetTicketAfterMinute,
    updateTicketStatusToExecute: updateTicketStatusToExecute,
    findMeaningTicketByCustomerId: findMeaningTicketByCustomerId,
    ticketAndBookSeatRefundProcessExecute: ticketAndBookSeatRefundProcessExecute,
    updateTicketTo: updateTicketTo
};
//# sourceMappingURL=ticketService.js.map