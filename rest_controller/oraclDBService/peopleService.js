var oracledb = require('oracledb');
var dbConfig = require('../../config/oracle-db-config');
const findPeopleAPI = () => {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig, (err, connection) => {
            if(err) {
                console.log('hello Error');
                return;
            }
            connection.execute("SELECT * from PERSON",[],
                { outFormat: oracledb.OBJECT },(error, result) => {
                    if(error) {
                        reject(error);
                        return 'error is there fucking';
                    }
                    console.log("QUERY RESULTS: ");
                    console.log(result.rows);
                    resolve(result.rows);
                })
        });
    })
}
module.exports = {
    findPeople: findPeopleAPI,
}