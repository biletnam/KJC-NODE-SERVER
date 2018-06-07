const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');
const getConnection = (callback) => {return oracledb.getConnection(dbConfig.connectConfig, callback)};

module.exports = {
    getConnection
}