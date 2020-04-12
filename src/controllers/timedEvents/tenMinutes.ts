/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const constants = require('../constants');
const userLivesController = require('../action/userLives');

_.set(exports, 'processTenMinuteActions', function (serverName, fullySynced) {
	if (fullySynced) {
		if(_.get(constants, 'config.lifePointsEnabled')) {
			userLivesController.updateServerLifePoints(serverName);
		}
	}
});
