/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const aiConvoysController = require('../action/aiConvoys');

_.set(exports, 'processThirtyMinuteActions', function (serverName, fullySynced) {
	if (fullySynced) {
		aiConvoysController.maintainPvEConfig(serverName)
			.catch(function (err) {
				console.log('err line16: ', err);
			})
		;
	}
});
