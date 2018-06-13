const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');
const commonUtil = require('../../commonModule/commonUtil');
const movieService = require('./movieService');
const cinemaService = require('./cinemaService');
const branchService = require('./branchService');
const playTypeService = require('./price/playTypeService');

function findBranchAndCinema(CINEMA_NO, BRCH_ID) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute('SELECT * FROM CINEMA C JOIN BRANCH B ON(C.BRCH_ID = B.BRCH_ID) WHERE C.CINEMA_NO = :CINEMA_NO AND C.BRCH_ID = :BRCH_ID',
                {CINEMA_NO: CINEMA_NO, BRCH_ID: BRCH_ID},
                    {outFormat: oracledb.OBJECT}, (err, result) => {
                        if(err) {
                            console.log(err);
                            doRelease(connection);
                            reject('error');
                            return;
                        }
                        doRelease(connection);
                        resolve(result.rows);
                    });
            }).catch((error) => {console.log(error)});
    })

}
function insertPlayInfoExecute(connection,scheduleObject) {
    const movieP = movieService.findMovieById(scheduleObject.MOVIE_ID);
    const cinemaBranchP = findBranchAndCinema(scheduleObject.CINEMA_NO, scheduleObject.BRCH_ID);
    const playTypeP = playTypeService.findPlayTypeById(scheduleObject.PT_ID);
    return Promise.all([movieP, cinemaBranchP, playTypeP]).then(function(values){
        const movies = values[0];
        const cinemaBranches = values[1];
        const playTypes = values[2];
        const movie = movies[0];
        const cinemaBranch = cinemaBranches[0];
        const playType = playTypes[0];
        return connection.execute(`INSERT INTO PLAY_INFO VALUES(:FLOOR, :BRCH_NAME, TO_DATE(:PL_START_TIME, 'YYYYMMDDHH24MI'), TO_DATE(:PL_END_TIME, 'YYYYMMDDHH24MI'), :CINEMA_NO, :MOVIE_NAME, SCHEDULE_SEQ.CURRVAL, :PT_NAME)`,
            {FLOOR: cinemaBranch.FLOOR, BRCH_NAME: cinemaBranch.BRCH_NAME,
                PL_START_TIME: scheduleObject.PL_START_TIME,
                PL_END_TIME: scheduleObject.PL_END_TIME,
                CINEMA_NO: scheduleObject.CINEMA_NO,
                MOVIE_NAME: movie.MOVIE_NAME,
                PT_NAME: playType.PT_NAME}, {autoCommit: false})
            .then((result) => connection)
    })
}
function deletePlayInfoBySchedIdExecute(connection, schedId) {
    return connection.execute('DELETE FROM PLAY_INFO WHERE SCHED_ID = :SCHED_ID',{SCHED_ID: schedId}, {autoCommit: false})
        .then((result) => connection);
}
function doRelease(connection) {
    return connection.close((err) => {
        if(err) {
            console.log(err);
        }
    })
}

module.exports = {
    insertPlayInfoExecute,
    deletePlayInfoBySchedIdExecute
}