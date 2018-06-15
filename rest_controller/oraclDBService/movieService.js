const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');

const insertMovieExecute = (movieObject, connection) => {
    console.log(movieObject);
    const sql = 'INSERT INTO MOVIE (MOVIE_ID, MOVIE_NAME, MOVIE_INTRO, RUNTIME, DIST, MOVIE_IMG, RATE, GENRE, VIDEO_ADDR) ' +
        'VALUES(MOVIE_SEQ.NEXTVAL, :MOVIE_NAME, :MOVIE_INTRO, :RUNTIME, :DIST, :MOVIE_IMG, :RATE, :GENRE, :VIDEO_ADDR)';
    return connection.execute(sql,
        {MOVIE_NAME:movieObject.MOVIE_NAME, MOVIE_INTRO: movieObject.MOVIE_INTRO, RUNTIME: movieObject.RUNTIME, DIST: movieObject.DIST, MOVIE_IMG: movieObject.MOVIE_IMG, RATE: movieObject.RATE, GENRE: movieObject.GENRE,
            VIDEO_ADDR: movieObject.VIDEO_ADDR}
        ,{autoCommit: false})
        .then((result) => connection)
        .catch((error) => console.log(error));
}
const insertRelatedPerson = (connection, movieObject, resolve, reject) => {
    const people = movieObject.PEOPLE.map((p) => {
        const person = {};
        person.PER_ID = p.PER_ID;
        if(!p.IS_MAIN) {
            person.IS_MAIN = 'N';
        }else {
            person.IS_MAIN = 'Y';
        }
        person.CH_NAME = p.CH_NAME;
        return person;
    })
    console.log(people);
    return connection.executeMany('INSERT INTO RELATED_PERSON VALUES(MOVIE_SEQ.CURRVAL, :IS_MAIN, :CH_NAME, :PER_ID)',
        people,
        {autoCommit: false}, (err, result) => {
            if(err) {
                doRelease(connection);
                console.log(err);
                reject('error');
                return;
            }
            connection.commit((err) => {
                if(err) {
                    doRelease(connection);
                    console.log(err);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve('success');
            })
        })
}
const insertMovieAPI = (movieObject) => {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return insertMovieExecute(movieObject, connection);
            }).then((connection) => {
            if(movieObject.PEOPLE && movieObject.PEOPLE.length !== 0 ){
                return insertRelatedPerson(connection,movieObject, resolve, reject);
            }else {
                connection.commit((err) => {
                    if(err) {
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve('success');
                })
            }
        }).catch((error) => { console.log(error)});
    })

}
const findAllMovie = () => {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute('SELECT M.*, RP.PER_ID, RP.PER_NAME, RP.PER_IMG, RP.CH_NAME, RP.IS_MAIN ' +
                    'FROM (SELECT * FROM MOVIE) M LEFT OUTER JOIN ' +
                    '(SELECT P.PER_ID, P.PER_NAME, P.PER_IMG, P.ROLE, R.CH_NAME, R.MOVIE_ID, R.IS_MAIN FROM PERSON P, RELATED_PERSON R WHERE P.PER_ID = R.PER_ID) RP ' +
                    'ON(M.MOVIE_ID = RP.MOVIE_ID)', [], {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err){
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            }).catch((error) => {
            console.log(error);
        })
    })
}

const findMovieById = (MOVIE_ID) => {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                 connection.execute('SELECT * FROM MOVIE WHERE MOVIE_ID = :MOVIE_ID', {MOVIE_ID: MOVIE_ID}, {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err){
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            }).catch((error) => {
            console.log(error);
        })
    })
}
function moviePlayingChange(movieId, value) {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                connection.execute('UPDATE MOVIE SET IS_PLAYING = :IS_PLAYING WHERE MOVIE_ID = :MOVIE_ID', {IS_PLAYING: value, MOVIE_ID: movieId}, {autoCommit: true}, (err, result) => {
                    if(err){
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve('success');
                })
            }).catch((error) => {
            console.log(error);
        })
    })
}
function findAllPlayingMovie() {
    return new Promise((resolve, reject) => {
        oracledb.getConnection(dbConfig.connectConfig)
            .then((connection) => {
                return connection.execute('SELECT M.*, RP.PER_ID, RP.PER_NAME, RP.PER_IMG, RP.CH_NAME, RP.IS_MAIN ' +
                    'FROM (SELECT * FROM MOVIE) M LEFT OUTER JOIN ' +
                    '(SELECT P.PER_ID, P.PER_NAME, P.PER_IMG, P.ROLE, R.CH_NAME, R.MOVIE_ID, R.IS_MAIN FROM PERSON P, RELATED_PERSON R WHERE P.PER_ID = R.PER_ID) RP ' +
                    "ON(M.MOVIE_ID = RP.MOVIE_ID) WHERE M.IS_PLAYING = 'Y'", [], {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err){
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve(result.rows);
                })
            }).catch((error) => {
            console.log(error);
        })
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
    insertMovie: insertMovieAPI,
    findAllMovie,
    findMovieById,
    moviePlayingChange,
    findAllPlayingMovie
}