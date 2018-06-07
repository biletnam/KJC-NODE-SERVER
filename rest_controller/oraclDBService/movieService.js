const dbConfig = require('../../config/oracle-db-config');
const oracledb = require('oracledb');

const insertMovieExecute = (movieObject, connection) => {
    return connection.execute('INSERT INTO MOVIE VALUES(MOVIE_SEQ.NEXTVAL, :MOVIE_NAME, :MOVIE_INTRO, :RUNTIME, :DIST, :MOVIE_IMG, :RATE, :GENRE)',
        {MOVIE_NAME:movieObject.MOVIE_NAME, MOVIE_INTRO: movieObject.MOVIE_INTRO, RUNTIME: movieObject.RUNTIME, DIST: movieObject.DIST, MOVIE_IMG: movieObject.MOVIE_IMG, RATE: movieObject.RATE, GENRE: movieObject.GENRE}
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
    return connection.executeMany('INSERT INTO RELATED_PERSON VALUES(:PER_ID, MOVIE_SEQ.CURRVAL, :IS_MAIN, :CH_NAME)',
        people,
        {autoCommit: false}, (err, result) => {
            if(err) {
                console.log(err);
                reject('error');
                return;
            }
            connection.commit((err) => {
                if(err) {
                    console.log(err);
                    reject('error');
                    return;
                }
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
                        reject('error');
                        return;
                    }
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
                return connection.execute('SELECT M.*, RP.PER_NAME, RP.PER_IMG, RP.CH_NAME, RP.IS_MAIN ' +
                    'FROM (SELECT * FROM MOVIE) M LEFT OUTER JOIN ' +
                    '(SELECT P.PER_NAME, P.PER_IMG, P.ROLE, R.CH_NAME, R.MOVIE_ID, R.IS_MAIN FROM PERSON P, RELATED_PERSON R WHERE P.PER_ID = R.PER_ID) RP ' +
                    'ON(M.MOVIE_ID = RP.MOVIE_ID)', [], {outFormat: oracledb.OBJECT}, (err, result) => {
                    if(err){
                        console.log(err);
                        reject('error');
                        return;
                    }
                    resolve(result.rows);
                })
            }).catch((error) => {
            console.log(error);
        })
    })
}

module.exports = {
    insertMovie: insertMovieAPI,
    findAllMovie
}