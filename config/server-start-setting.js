const ticketService = require('../rest_controller/oraclDBService/ticketService');

function ticketReset() {
    setTimeout(() => {
        ticketService.checkAndResetTicketAfterMinute(1)
            .then((data) => console.log(data))
            .catch((error) => console.log(error));
    }, 180000);
}

function startSetting() {
    ticketReset();
}
module.exports = {
    startSetting: startSetting
}