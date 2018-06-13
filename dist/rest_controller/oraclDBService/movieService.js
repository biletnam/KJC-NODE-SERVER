'use strict';

var dbConfig = require('../../config/oracle-db-config');
var oracledb = require('oracledb');

var insertMovieExecute = function insertMovieExecute(movieObject, connection) {
    console.log(movieObject);
    var sql = 'INSERT INTO MOVIE (MOVIE_ID, MOVIE_NAME, MOVIE_INTRO, RUNTIME, DIST, MOVIE_IMG, RATE, GENRE) ' + 'VALUES(MOVIE_SEQ.NEXTVAL, :MOVIE_NAME, :MOVIE_INTRO, :RUNTIME, :DIST, :MOVIE_IMG, :RATE, :GENRE)';
    return connection.execute(sql, { MOVIE_NAME: movieObject.MOVIE_NAME, MOVIE_INTRO: movieObject.MOVIE_INTRO, RUNTIME: movieObject.RUNTIME, DIST: movieObject.DIST, MOVIE_IMG: movieObject.MOVIE_IMG, RATE: movieObject.RATE, GENRE: movieObject.GENRE }, { autoCommit: false }).then(function (result) {
        return connection;
    }).catch(function (error) {
        return console.log(error);
    });
};
var insertRelatedPerson = function insertRelatedPerson(connection, movieObject, resolve, reject) {
    var people = movieObject.PEOPLE.map(function (p) {
        var person = {};
        person.PER_ID = p.PER_ID;
        if (!p.IS_MAIN) {
            person.IS_MAIN = 'N';
        } else {
            person.IS_MAIN = 'Y';
        }
        person.CH_NAME = p.CH_NAME;
        return person;
    });
    console.log(people);
    return connection.executeMany('INSERT INTO RELATED_PERSON VALUES(MOVIE_SEQ.CURRVAL, :IS_MAIN, :CH_NAME, :PER_ID)', people, { autoCommit: false }, function (err, result) {
        if (err) {
            doRelease(connection);
            console.log(err);
            reject('error');
            return;
        }
        connection.commit(function (err) {
            if (err) {
                doRelease(connection);
                console.log(err);
                reject('error');
                return;
            }
            doRelease(connection);
            resolve('success');
        });
    });
};
var insertMovieAPI = function insertMovieAPI(movieObject) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return insertMovieExecute(movieObject, connection);
        }).then(function (connection) {
            if (movieObject.PEOPLE && movieObject.PEOPLE.length !== 0) {
                return insertRelatedPerson(connection, movieObject, resolve, reject);
            } else {
                connection.commit(function (err) {
                    if (err) {
                        console.log(err);
                        doRelease(connection);
                        reject('error');
                        return;
                    }
                    doRelease(connection);
                    resolve('success');
                });
            }
        }).catch(function (error) {
            console.log(error);
        });
    });
};
var findAllMovie = function findAllMovie() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT M.*, RP.PER_ID, RP.PER_NAME, RP.PER_IMG, RP.CH_NAME, RP.IS_MAIN ' + 'FROM (SELECT * FROM MOVIE) M LEFT OUTER JOIN ' + '(SELECT P.PER_ID, P.PER_NAME, P.PER_IMG, P.ROLE, R.CH_NAME, R.MOVIE_ID, R.IS_MAIN FROM PERSON P, RELATED_PERSON R WHERE P.PER_ID = R.PER_ID) RP ' + 'ON(M.MOVIE_ID = RP.MOVIE_ID)', [], { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (error) {
            console.log(error);
        });
    });
};

var findMovieById = function findMovieById(MOVIE_ID) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            connection.execute('SELECT * FROM MOVIE WHERE MOVIE_ID = :MOVIE_ID', { MOVIE_ID: MOVIE_ID }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (error) {
            console.log(error);
        });
    });
};
function moviePlayingChange(movieId, value) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            connection.execute('UPDATE MOVIE SET IS_PLAYING = :IS_PLAYING WHERE MOVIE_ID = :MOVIE_ID', { IS_PLAYING: value, MOVIE_ID: movieId }, { autoCommit: true }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve('success');
            });
        }).catch(function (error) {
            console.log(error);
        });
    });
}
function findAllPlayingMovie() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT M.*, RP.PER_ID, RP.PER_NAME, RP.PER_IMG, RP.CH_NAME, RP.IS_MAIN ' + 'FROM (SELECT * FROM MOVIE) M LEFT OUTER JOIN ' + '(SELECT P.PER_ID, P.PER_NAME, P.PER_IMG, P.ROLE, R.CH_NAME, R.MOVIE_ID, R.IS_MAIN FROM PERSON P, RELATED_PERSON R WHERE P.PER_ID = R.PER_ID) RP ' + "ON(M.MOVIE_ID = RP.MOVIE_ID) WHERE M.IS_PLAYING = 'Y'", [], { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                    reject('error');
                    return;
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (error) {
            console.log(error);
        });
    });
}
function doRelease(connection) {
    return connection.close(function (err) {
        if (err) {
            console.log(err);
        }
    });
}
module.exports = {
    insertMovie: insertMovieAPI,
    findAllMovie: findAllMovie,
    findMovieById: findMovieById,
    moviePlayingChange: moviePlayingChange,
    findAllPlayingMovie: findAllPlayingMovie
};
//# sourceMappingURL=movieService.js.map