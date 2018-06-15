'use strict';

var ticketService = require('../rest_controller/oraclDBService/ticketService');

function ticketReset() {
    setTimeout(function () {
        ticketService.checkAndResetTicketAfterMinute(1).then(function (data) {
            return console.log(data);
        }).catch(function (error) {
            return console.log(error);
        });
    }, 180000);
}

function startSetting() {
    ticketReset();
}
module.exports = {
    startSetting: startSetting
};
//# sourceMappingURL=server-start-setting.js.map