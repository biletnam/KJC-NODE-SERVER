var oracledb = require('oracledb');
var dbConfig = require('../../config/oracle-db-config');
const registerCustomerAPI = () => {
    const promise = new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig, (err, connection) => {
                if(err) {
                    console.log('hello Error');
                    return;
                }
                connection.execute("INSERT INTO CUSTOMER VALUES(CUST_SEQUENCE.NEXTVAL, :IS_USER, :PHONE, :NAME)",
                    {IS_USER: 'Y', PHONE: '01052781809', NAME: '최원표'}, { outFormat: oracledb.OBJECT, autoCommit: false },
                    (error, result) => {
                        if(error) {
                            reject(error);
                            return 'error is there fucking';
                        }
                        console.log("QUERY RESULTS: ");
                        console.log(result.rows);
                        resolve(connection);
            });
        });
    });
    return promise.then((connection) => registerUser(connection));
}
const registerUser = (connection) => {
    return new Promise((resolve, reject) => {
        connection.execute("INSERT INTO USER_CUST VALUES(CUST_SEQUENCE.CURRVAL, 'tkfk626', '1234567890', '123', '1','서울 특별시','동대문구', 'tkfk626@naver.com', 10000, '2018-06-02')",
            [],
            { outFormat: oracledb.OBJECT, autoCommit: false },(error, result) => {
                if(error) {
                    reject(error);
                    return 'error is there fucking';
                }
                console.log("QUERY RESULTS: ");
                console.log(result.rows);
                connection.commit((err) => {
                    if(err) {
                        console.log(err);
                        reject('error while commit', err);
                        return;
                    }
                    resolve('success');
                });
            });
    })
}
const findCustomerAPI = () => {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig, (err, connection) => {
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
module.exports = {
    registerPeople: registerCustomerAPI,
    findCustomers: findCustomerAPI
}