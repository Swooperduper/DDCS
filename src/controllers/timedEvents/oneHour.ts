/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const repairController = require('../menu/repair');

_.set(exports, 'processOneHourActions', function (serverName, fullySynced) {
	if (fullySynced) {
		repairController.repairBaseSAMRadars(serverName);
	}
});
