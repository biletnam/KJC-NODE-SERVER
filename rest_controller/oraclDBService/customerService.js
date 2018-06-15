var oracledb = require('oracledb');
var dbConfig = require('../../config/oracle-db-config');
const commonUtil = require('../../commonModule/commonUtil');
function insertCustomerStep(connection, userDataObject, resolve, reject){
    return connection.execute("INSERT INTO CUSTOMER VALUES(CUSTOMER_SEQ.NEXTVAL, :IS_USER, :PHONE, :USER_NAME)",
        {IS_USER: 'Y', PHONE: userDataObject.PHONE, USER_NAME: userDataObject.USER_NAME}, { outFormat: oracledb.OBJECT, autoCommit: false })
        .then((result) => connection)
}
function insertUserStep(connection, userDataObject, resolve, reject) {
    return connection.execute("INSERT INTO USERS (USER_ID, ZIP_CODE, ADDR, ADDR_DET, EMAIL, BIRTH, CUST_ID, PASSWORD, SALT) " +
        "VALUES(:USER_ID, :ZIP_CODE, :ADDR, :ADDR_DET, :EMAIL, :BIRTH, CUSTOMER_SEQ.CURRVAL , :PASSWORD, :SALT)",
        {USER_ID: userDataObject.USER_ID, ZIP_CODE: userDataObject.ZIP_CODE, ADDR: userDataObject.ADDR, ADDR_DET:userDataObject.ADDR_DET
            ,EMAIL: userDataObject.EMAIL, BIRTH: userDataObject.BIRTH, PASSWORD: userDataObject.PASSWORD, SALT: userDataObject.SALT},
        { outFormat: oracledb.OBJECT, autoCommit: false },(error, result) => {
            if(error) {
                reject(error);
                return 'error is there';
            }
            connection.commit((err) => {
                if(err) {
                    console.log('error step',err);
                    doRelease(connection);
                    reject('error while commit', err);
                    return;
                }
                doRelease(connection);
                resolve('success');
            });
        })
}
function registerUser(userDataObject) {
    return new Promise((resolve, reject) => {
        let conn;
        findCustomerInfoOfUserByNameAndPhone(userDataObject.USER_NAME, userDataObject.PHONE)
            .then((data) => {
                if(data.length === 0 ) {
                    oracledb.getConnection(dbConfig.connectConfig)
                        .then((connection) => {
                            conn = connection
                            return insertCustomerStep(connection, userDataObject, resolve, reject);
                        }).then((connection) => {
                        return insertUserStep(connection, userDataObject, resolve, reject);
                    }).catch((error) => {
                        console.log(error);
                        if(conn) {
                            doRelease(conn);
                        }
                    })
                } else {
                    reject('ALREADY');
                }
            }).catch((error) => {console.log('find customer Error')});

    }).catch((error) => {console.log('error the fuck', error)});
}
function registerNonUser(nonUserDataObject) {
    return new Promise((resolve, reject) => {
        let conn;
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute("INSERT INTO CUSTOMER VALUES(CUSTOMER_SEQ.NEXTVAL, :IS_USER, :PHONE, :USER_NAME)",
                    {IS_USER: 'N', PHONE: nonUserDataObject.PHONE, USER_NAME: nonUserDataObject.USER_NAME}, { outFormat: oracledb.OBJECT, autoCommit: true });
            }).then((result) => {
            resolve(nonUserDataObject);
        }).catch((error) => {
            reject(error);
        })
    });
}
function findCustomerAPI() {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig, (err, connection) => {
            if(err) {
                console.log('hello Error');
                return;
            }
            connection.execute("SELECT * FROM CUSTOMER",
                [],
                { outFormat: oracledb.OBJECT},(error, result) => {
                    resolve(result.rows);
                    if(error) {
                        reject(error);
                        return 'error is there fucking';
                    }

                });
        })
    })
}
function findAllUser() {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig, (err, connection) => {
            connection.execute('SELECT * from USERS', [], {outFormat: oracledb.OBJECT}, (err, result) => {
                if(err) {
                    doRelease(connection);
                    reject(err);
                    return 'error';
                }
                doRelease(connection);
                resolve(result.rows);
            })
        })
    })
}
function userIdCheck(id) {
    return new Promise((resolve,reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute('SELECT 1 FROM USERS WHERE USER_ID = :USER_ID', {USER_ID: id}, { outFormat: oracledb.OBJECT })
                    .then((result) => {
                        resolve(result.rows);
                }).catch((error) => {
                    console.log('has error while select', error);
                    reject('error');
                });
            }).catch((error) => {
                console.log('error while Connection', error);
            })
    })
}
function findUserById(id) {
    let conn;
    return new Promise((resolve, reject) => {
            oracledb.getConnection(dbConfig.connectConfig)
                .then((connection) => {
                    conn = connection;
                    return connection.execute('SELECT * FROM USERS U NATURAL JOIN CUSTOMER C WHERE U.USER_ID = :USER_ID', {USER_ID: id}, {outFormat: oracledb.OBJECT})
                        .then((result) => resolve(result.rows))
                        .catch((error) => {
                            console.log('error while findUser', error);
                            reject('error');
                        })
                }).then(() => {if(conn) {return conn.close()}}).catch((error) => {console.log('inner promise error', error)});
        }
    ).catch((error) => {console.log('error of outer Promise', error)});
}
function findUserByCustomerId(cid){
    return new Promise((resolve, reject) => {
            oracledb.getConnection(dbConfig.connectConfig)
                .then((connection) => {
                    return connection.execute('SELECT * FROM USERS U JOIN CUSTOMER C ON(U.CUST_ID = C.CUST_ID) WHERE C.CUST_ID = :CUST_ID', {CUST_ID: cid}, {outFormat: oracledb.OBJECT},
                        (err, result) => {
                            if(err) {
                                doRelease(connection);
                                console.log(err);
                                reject(err);
                                return;
                            }
                            doRelease(connection);
                            resolve(result.rows);
                        })
                }).catch((error) => {console.log('inner promise error', error)});
        }
    )
}
function findCustomerByNameAndPhone(name, phone){
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute('SELECT * FROM CUSTOMER WHERE USER_NAME = :USER_NAME AND PHONE = :PHONE', {USER_NAME: name, PHONE: phone}, {outFormat: oracledb.OBJECT},
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
            }).catch((error) => {console.log('inner promise error', error)});
    })
}
function findNonUserCustomerByNameAndPhone(name, phone){
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute("SELECT * FROM CUSTOMER WHERE USER_NAME = :USER_NAME AND PHONE = :PHONE AND IS_USER = 'N'", {USER_NAME: name, PHONE: phone}, {outFormat: oracledb.OBJECT},
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
            }).catch((error) => {console.log('inner promise error', error)});
    })
}

function findCustomerInfoOfUserByNameAndPhone(name, phone){
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute(`SELECT * FROM CUSTOMER WHERE USER_NAME = :USER_NAME AND PHONE = :PHONE AND IS_USER = 'Y'`, {USER_NAME: name, PHONE: phone}, {outFormat: oracledb.OBJECT},
                    (err, result) => {
                        if(err) {
                            console.log(err);
                            doRelease(connection)
                            reject(err);
                            return;
                        }
                        doRelease(connection);
                        resolve(result.rows)
                    });
            }).catch((error) => {console.log('inner promise error', error)});
    })
}

function updatePointOfUser(customerId, point, operator) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                let sql;
                if(operator) {
                    sql = `UPDATE USERS SET POINT = POINT ${operator} ${point} WHERE CUST_ID = :CUST_ID`;
                }else {
                    sql = `UPDATE USERS SET POINT = ${point} WHERE CUST_ID = :CUST_ID`;
                }
                return connection.execute(sql, {CUST_ID: customerId}, {outFormat: oracledb.OBJECT, autoCommit: true},
                    (err, result) => {
                        if(err) {
                            console.log(err);
                            doRelease(connection)
                            reject(err);
                            return;
                        }
                        doRelease(connection);
                        resolve('success');
                    });
            }).catch((error) => {console.log('inner promise error', error)});
    })
}
function updatePointOfUserExecute(connection,customerId,point,operator) {
    let sql;
    if(operator) {
        sql = `UPDATE USERS SET POINT = POINT ${operator} ${point} WHERE CUST_ID = :CUST_ID`;
    }else {
        sql = `UPDATE USERS SET POINT = ${point} WHERE CUST_ID = :CUST_ID`;
    }
    console.log(sql);
    return connection.execute(sql, {CUST_ID: customerId}, {outFormat: oracledb.OBJECT, autoCommit: false}).then((result) => connection);
}

function findNonUserCustomerByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute(`SELECT * FROM CUSTOMER WHERE CUST_ID = :CUST_ID AND IS_USER = 'N'`, {CUST_ID: customerId}, {outFormat: oracledb.OBJECT},
                    (err, result) => {
                        if(err) {
                            console.log(err);
                            doRelease(connection)
                            reject(err);
                            return;
                        }
                        doRelease(connection);
                        resolve(result.rows)
                    });
            }).catch((error) => {console.log('inner promise error', error)});
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
    registerUser: registerUser,
    findCustomers: findCustomerAPI,
    userIdCheck: userIdCheck,
    findUserById: findUserById,
    findCustomerByNameAndPhone: findCustomerByNameAndPhone,
    findNonUserCustomerByNameAndPhone,
    registerNonUser,
    findUserByCustomerId,
    updatePointOfUser,
    updatePointOfUserExecute,
    findNonUserCustomerByCustomerId,
    findAllUser
}