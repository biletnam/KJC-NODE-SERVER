'use strict';

var dbConfig = require('../../config/oracle-db-config');
var oracledb = require('oracledb');
var getConnection = function getConnection(callback) {
    return oracledb.getConnection(dbConfig.connectConfig, callback);
};

module.exports = {
    getConnection: getConnection
};
//# sourceMappingURL=oracleDBConfig.js.map