/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const eventHitController = require('../events/frontend/S_EVENT_HIT');

_.set(exports, 'processOneSecActions', function (serverName, fullySynced) {
	if (fullySynced) {
		eventHitController.checkShootingUsers(serverName);

		// proximityController.checkUnitsToBaseForTroops(serverName);

		// proximityController.checkUnitsToLogisticTowers(serverName);
	}
});

