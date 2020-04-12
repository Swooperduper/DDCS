/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const radioTowerController = require('../action/radioTower');
const minutesPlayedController = require('../action/minutesPlayed');

_.set(exports, 'processFiveMinuteActions', function (serverName, fullySynced) {
	if (fullySynced) {
		radioTowerController.checkBaseWarnings(serverName);
		minutesPlayedController.recordFiveMinutesPlayed(serverName);
	}
});
