'use strict';

var oracledb = require('oracledb');
var dbConfig = require('../../config/oracle-db-config');
var commonUtil = require('../../commonModule/commonUtil');
function insertCustomerStep(connection, userDataObject, resolve, reject) {
    return connection.execute("INSERT INTO CUSTOMER VALUES(CUSTOMER_SEQ.NEXTVAL, :IS_USER, :PHONE, :USER_NAME)", { IS_USER: 'Y', PHONE: userDataObject.PHONE, USER_NAME: userDataObject.USER_NAME }, { outFormat: oracledb.OBJECT, autoCommit: false }).then(function (result) {
        return connection;
    });
}
function insertUserStep(connection, userDataObject, resolve, reject) {
    return connection.execute("INSERT INTO USERS (USER_ID, ZIP_CODE, ADDR, ADDR_DET, EMAIL, BIRTH, CUST_ID, PASSWORD, SALT) " + "VALUES(:USER_ID, :ZIP_CODE, :ADDR, :ADDR_DET, :EMAIL, :BIRTH, CUSTOMER_SEQ.CURRVAL , :PASSWORD, :SALT)", { USER_ID: userDataObject.USER_ID, ZIP_CODE: userDataObject.ZIP_CODE, ADDR: userDataObject.ADDR, ADDR_DET: userDataObject.ADDR_DET,
        EMAIL: userDataObject.EMAIL, BIRTH: userDataObject.BIRTH, PASSWORD: userDataObject.PASSWORD, SALT: userDataObject.SALT }, { outFormat: oracledb.OBJECT, autoCommit: false }, function (error, result) {
        if (error) {
            reject(error);
            return 'error is there';
        }
        connection.commit(function (err) {
            if (err) {
                console.log('error step', err);
                doRelease(connection);
                reject('error while commit', err);
                return;
            }
            doRelease(connection);
            resolve('success');
        });
    });
}
function registerUser(userDataObject) {
    return new Promise(function (resolve, reject) {
        var conn = void 0;
        findCustomerInfoOfUserByNameAndPhone(userDataObject.USER_NAME, userDataObject.PHONE).then(function (data) {
            if (data.length === 0) {
                oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
                    conn = connection;
                    return insertCustomerStep(connection, userDataObject, resolve, reject);
                }).then(function (connection) {
                    return insertUserStep(connection, userDataObject, resolve, reject);
                }).catch(function (error) {
                    console.log(error);
                    if (conn) {
                        doRelease(conn);
                    }
                });
            } else {
                reject('ALREADY');
            }
        }).catch(function (error) {
            console.log('find customer Error');
        });
    }).catch(function (error) {
        console.log('error the fuck', error);
    });
}
function registerNonUser(nonUserDataObject) {
    return new Promise(function (resolve, reject) {
        var conn = void 0;
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute("INSERT INTO CUSTOMER VALUES(CUSTOMER_SEQ.NEXTVAL, :IS_USER, :PHONE, :USER_NAME)", { IS_USER: 'N', PHONE: nonUserDataObject.PHONE, USER_NAME: nonUserDataObject.USER_NAME }, { outFormat: oracledb.OBJECT, autoCommit: true });
        }).then(function (result) {
            resolve(nonUserDataObject);
        }).catch(function (error) {
            reject(error);
        });
    });
}
function findCustomerAPI() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig, function (err, connection) {
            if (err) {
                console.log('hello Error');
                return;
            }
            connection.execute("SELECT * FROM CUSTOMER", [], { outFormat: oracledb.OBJECT }, function (error, result) {
                resolve(result.rows);
                if (error) {
                    reject(error);
                    return 'error is there fucking';
                }
            });
        });
    });
}
function findAllUser() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig, function (err, connection) {
            connection.execute('SELECT * from USERS', [], { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    doRelease(connection);
                    reject(err);
                    return 'error';
                }
                doRelease(connection);
                resolve(result.rows);
            });
        });
    });
}
function userIdCheck(id) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            connection.execute('SELECT 1 FROM USERS WHERE USER_ID = :USER_ID', { USER_ID: id }, { outFormat: oracledb.OBJECT }).then(function (result) {
                resolve(result.rows);
            }).catch(function (error) {
                console.log('has error while select', error);
                reject('error');
            });
        }).catch(function (error) {
            console.log('error while Connection', error);
        });
    });
}
function findUserById(id) {
    var conn = void 0;
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            conn = connection;
            return connection.execute('SELECT * FROM USERS U NATURAL JOIN CUSTOMER C WHERE U.USER_ID = :USER_ID', { USER_ID: id }, { outFormat: oracledb.OBJECT }).then(function (result) {
                return resolve(result.rows);
            }).catch(function (error) {
                console.log('error while findUser', error);
                reject('error');
            });
        }).then(function () {
            if (conn) {
                return conn.close();
            }
        }).catch(function (error) {
            console.log('inner promise error', error);
        });
    }).catch(function (error) {
        console.log('error of outer Promise', error);
    });
}
function findUserByCustomerId(cid) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT * FROM USERS U JOIN CUSTOMER C ON(U.CUST_ID = C.CUST_ID) WHERE C.CUST_ID = :CUST_ID', { CUST_ID: cid }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    doRelease(connection);
                    console.log(err);
                    reject(err);
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (error) {
            console.log('inner promise error', error);
        });
    });
}
function findCustomerByNameAndPhone(name, phone) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT * FROM CUSTOMER WHERE USER_NAME = :USER_NAME AND PHONE = :PHONE', { USER_NAME: name, PHONE: phone }, { outFormat: oracledb.OBJECT }, function (err, result) {
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
            console.log('inner promise error', error);
        });
    });
}
function findNonUserCustomerByNameAndPhone(name, phone) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute("SELECT * FROM CUSTOMER WHERE USER_NAME = :USER_NAME AND PHONE = :PHONE AND IS_USER = 'N'", { USER_NAME: name, PHONE: phone }, { outFormat: oracledb.OBJECT }, function (err, result) {
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
            console.log('inner promise error', error);
        });
    });
}

function findCustomerInfoOfUserByNameAndPhone(name, phone) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT * FROM CUSTOMER WHERE USER_NAME = :USER_NAME AND PHONE = :PHONE AND IS_USER = \'Y\'', { USER_NAME: name, PHONE: phone }, { outFormat: oracledb.OBJECT }, function (err, result) {
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
            console.log('inner promise error', error);
        });
    });
}

function updatePointOfUser(customerId, point, operator) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            var sql = void 0;
            if (operator) {
                sql = 'UPDATE USERS SET POINT = POINT ' + operator + ' ' + point + ' WHERE CUST_ID = :CUST_ID';
            } else {
                sql = 'UPDATE USERS SET POINT = ' + point + ' WHERE CUST_ID = :CUST_ID';
            }
            return connection.execute(sql, { CUST_ID: customerId }, { outFormat: oracledb.OBJECT, autoCommit: true }, function (err, result) {
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
            console.log('inner promise error', error);
        });
    });
}
function updatePointOfUserExecute(connection, customerId, point, operator) {
    var sql = void 0;
    if (operator) {
        sql = 'UPDATE USERS SET POINT = POINT ' + operator + ' ' + point + ' WHERE CUST_ID = :CUST_ID';
    } else {
        sql = 'UPDATE USERS SET POINT = ' + point + ' WHERE CUST_ID = :CUST_ID';
    }
    console.log(sql);
    return connection.execute(sql, { CUST_ID: customerId }, { outFormat: oracledb.OBJECT, autoCommit: false }).then(function (result) {
        return connection;
    });
}

function findNonUserCustomerByCustomerId(customerId) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT * FROM CUSTOMER WHERE CUST_ID = :CUST_ID AND IS_USER = \'N\'', { CUST_ID: customerId }, { outFormat: oracledb.OBJECT }, function (err, result) {
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
            console.log('inner promise error', error);
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
    registerUser: registerUser,
    findCustomers: findCustomerAPI,
    userIdCheck: userIdCheck,
    findUserById: findUserById,
    findCustomerByNameAndPhone: findCustomerByNameAndPhone,
    findNonUserCustomerByNameAndPhone: findNonUserCustomerByNameAndPhone,
    registerNonUser: registerNonUser,
    findUserByCustomerId: findUserByCustomerId,
    updatePointOfUser: updatePointOfUser,
    updatePointOfUserExecute: updatePointOfUserExecute,
    findNonUserCustomerByCustomerId: findNonUserCustomerByCustomerId,
    findAllUser: findAllUser
};
//# sourceMappingURL=customerService.js.map