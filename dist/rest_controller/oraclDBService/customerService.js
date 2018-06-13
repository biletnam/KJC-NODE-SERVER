'use strict';

var oracledb = require('oracledb');
var dbConfig = require('../../config/oracle-db-config');
var commonUtil = require('../../commonModule/commonUtil');
function insertCustomerStep(connection, userDataObject, resolve, reject) {
    return connection.execute("INSERT INTO CUSTOMER VALUES(CUSTOMER_SEQ.NEXTVAL, :IS_USER, :PHONE, :USER_NAME)", { IS_USER: 'Y', PHONE: userDataObject.PHONE, USER_NAME: userDataObject.USER_NAME }, { outFormat: oracledb.OBJECT, autoCommit: false }).then(function (result) {
        return connection;
    }).catch(function (error) {
        return console.log(error);
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
                reject('error while commit', err);
                return;
            }
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
                    var conn = connection;
                    return insertCustomerStep(connection, userDataObject, resolve, reject);
                }).then(function (connection) {
                    return insertUserStep(connection, userDataObject, resolve, reject);
                }).then(function () {
                    if (conn) {
                        return conn.close();
                    }
                });
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
    var conn = void 0;
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            conn = connection;
            return connection.execute('SELECT * FROM USERS U JOIN CUSTOMER C ON(U.CUST_ID = C.CUST_ID) WHERE C.CUST_ID = :CUST_ID', { CUST_ID: cid }, { outFormat: oracledb.OBJECT }).then(function (result) {
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
    });
}
function findCustomerByNameAndPhone(name, phone) {
    var conn = void 0;
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            conn = connection;
            return connection.execute('SELECT * FROM CUSTOMER WHERE USER_NAME = :USER_NAME AND PHONE = :PHONE', { USER_NAME: name, PHONE: phone }, { outFormat: oracledb.OBJECT }).then(function (result) {
                return resolve(result.rows);
            }).catch(function (error) {
                console.log('error while findCustomer', error);
                reject('error');
            });
        }).then(function () {
            if (conn) {
                conn.close();
            }
        }).catch(function (error) {
            console.log('inner promise error', error);
        });
    });
}

function findCustomerInfoOfUserByNameAndPhone(name, phone) {
    var conn = void 0;
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            conn = connection;
            return connection.execute('SELECT * FROM CUSTOMER WHERE USER_NAME = :USER_NAME AND PHONE = :PHONE AND IS_USER = \'Y\'', { USER_NAME: name, PHONE: phone }, { outFormat: oracledb.OBJECT }).then(function (result) {
                return resolve(result.rows);
            }).catch(function (error) {
                console.log('error while findCustomer', error);
                reject('error');
            });
        }).then(function () {
            if (conn) {
                conn.close();
            }
        }).catch(function (error) {
            console.log('inner promise error', error);
        });
    });
}
module.exports = {
    registerUser: registerUser,
    findCustomers: findCustomerAPI,
    userIdCheck: userIdCheck,
    findUserById: findUserById,
    findCustomerByNameAndPhone: findCustomerByNameAndPhone,
    registerNonUser: registerNonUser,
    findUserByCustomerId: findUserByCustomerId
};
//# sourceMappingURL=customerService.js.map