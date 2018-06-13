'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var dbConfig = require('../../config/oracle-db-config');
var oracledb = require('oracledb');
var commonUtil = require('../../commonModule/commonUtil');
var seatService = require('./seatService');

var SeatMaker = function () {
    function SeatMaker() {
        _classCallCheck(this, SeatMaker);

        this.seatRowWrapper = {
            1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G', 8: 'F', 9: 'I',
            10: 'J', 11: 'K', 12: 'L', 13: 'M', 14: 'N', 15: 'O', 16: 'P', 17: 'Q', 18: 'R',
            19: 'S', 20: 'T', 21: 'U', 22: 'V', 23: 'W', 24: 'X', 25: 'Y', 26: 'Z' };
    }

    _createClass(SeatMaker, [{
        key: 'makeSeatNamesByRows',
        value: function makeSeatNamesByRows(rows) {
            var _this = this;

            var seatNames = [];
            rows.map(function (r) {
                var rowName = _this.seatRowWrapper[Number(r.id)];
                for (var i = 1; i <= Number(r.column); i++) {
                    var c = i < 10 ? '0' + i : '' + i;
                    var seatName = rowName + c;
                    seatNames.push(seatName);
                }
            });
            return seatNames;
        }
    }, {
        key: 'makeSeatObject',
        value: function makeSeatObject(seatName, cinemaObject) {
            return { SEAT_NAME: seatName, CINEMA_NO: cinemaObject.CINEMA_NO,
                BRCH_ID: cinemaObject.BRCH_ID, SEAT_TYPE_ID: cinemaObject.SEAT_TYPE_ID };
        }
    }, {
        key: 'makeSeatObjectArray',
        value: function makeSeatObjectArray(rows, cinemaObject) {
            var _this2 = this;

            var seatNames = this.makeSeatNamesByRows(rows);
            console.log(seatNames);
            var seatObjectArray = seatNames.map(function (s) {
                return _this2.makeSeatObject(s, cinemaObject);
            });
            return seatObjectArray;
        }
    }]);

    return SeatMaker;
}();

function insertCinema(cinemaObject) {
    var rows = cinemaObject.rows;
    var seatMaker = new SeatMaker();
    var seatObjectArray = seatMaker.makeSeatObjectArray(rows, cinemaObject);
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('INSERT INTO CINEMA VALUES(:CINEMA_NO, :BRCH_ID, :SEAT_CNT, :FLOOR)', { CINEMA_NO: cinemaObject.CINEMA_NO, BRCH_ID: cinemaObject.BRCH_ID, SEAT_CNT: seatObjectArray.length, FLOOR: cinemaObject.FLOOR }, { autoCommit: false }).then(function () {
                return connection;
            });
        }).then(function (connection) {
            console.log('we are groot');
            return seatService.firstBatchInsert(seatObjectArray, connection).then(function (result) {
                connection.commit(function (err) {
                    if (err) {
                        console.log('error while commit');
                        reject(err);
                        doRelease(connection);
                        return;
                    }
                    doRelease(connection);
                    resolve('success');
                });
            });
        }).catch(function (error) {
            reject(error);console.log(error);
        });
    });
}
function findAll() {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT * FROM CINEMA', [], { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log('error while select', err);
                    doRelease(connection);
                    reject(err);
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (error) {
            console.log('catch error outside');
        });
    });
}
function findCinemaByCinemaNoAndBranchId(CINEMA_NO, BRCH_ID) {
    return new Promise(function (resolve, reject) {
        oracledb.getConnection(dbConfig.connectConfig).then(function (connection) {
            return connection.execute('SELECT * FROM CINEMA WHERE CINEMA_NO = :CINEMA_NO AND BRCH_ID = :BRCH_ID', { CINEMA_NO: CINEMA_NO, BRCH_ID: BRCH_ID }, { outFormat: oracledb.OBJECT }, function (err, result) {
                if (err) {
                    console.log('error while select', err);
                    doRelease(connection);
                    reject(err);
                }
                doRelease(connection);
                resolve(result.rows);
            });
        }).catch(function (error) {
            console.log('catch error outside');
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
    insertCinema: insertCinema,
    findAll: findAll,
    findCinemaByCinemaNoAndBranchId: findCinemaByCinemaNoAndBranchId
};
//# sourceMappingURL=cinemaService.js.map