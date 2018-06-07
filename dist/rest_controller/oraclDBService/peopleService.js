'use strict';

var oracledb = require('oracledb');
var dbConfig = require('../../config/oracle-db-config');
var oracleDBConfig = require('../oraclDBService/oracleDBConfig');
var commonUtil = require('../../commonModule/commonUtil');
var findPeopleAPI = function findPeopleAPI() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig, function (err, connection) {
            if (err) {
                console.log('hello Error');
                return;
            }
            connection.execute("SELECT * from PERSON", [], { outFormat: oracledb.OBJECT }, function (error, result) {
                if (error) {
                    reject(error);
                    return 'error is there fucking';
                }
                console.log("QUERY RESULTS: ");
                console.log(result.rows);
                resolve(result.rows);
            });
        });
    });
};
function insertPerson(connection, personData, resolve, reject) {
    connection.execute("INSERT INTO PERSON VALUES(PERSON_SEQ.NEXTVAL, :PER_NAME, :PER_IMG, :ROLE)", { PER_NAME: personData.PER_NAME, PER_IMG: personData.PER_IMG, ROLE: personData.ROLE }, { autoCommit: true }, function (err, result) {
        if (err) {
            console.log(err);
            reject('error occur');
        }
        console.log(result);
        resolve(result);
    });
}
var insertPersonAPI = function insertPersonAPI(personData) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            insertPerson(connection, personData, resolve, reject);
        }).catch(commonUtil.defaultPromiseErrorHandler);
    });
};
module.exports = {
    findPeople: findPeopleAPI,
    insertPerson: insertPersonAPI
};
//# sourceMappingURL=peopleService.js.map