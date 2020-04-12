/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const constants = require('../../constants');
const masterDBController = require('../../db/masterDB');
const DCSLuaCommands = require('../../player/DCSLuaCommands');
const unitsStaticsController = require('../../serverToDbSync/unitsStatics');
const webPushCommands = require('../../socketIO/webPush');

_.set(exports, 'processEventCrash', function (serverName, sessionName, eventObj) {
	var nowTime = new Date().getTime();
	// Occurs when any aircraft crashes into the ground and is completely destroyed.
	masterDBController.unitActions('read', serverName, {unitId: _.get(eventObj, ['data', 'arg3'])})
		.then(function (iunit) {
			masterDBController.srvPlayerActions('read', serverName, {sessionName: sessionName})
				.then(function (playerArray) {
					var iPlayer;
					var iCurObj;
					var curIUnit = _.get(iunit, 0);
					if (curIUnit) {

						unitsStaticsController.processUnitUpdates(serverName, sessionName, {action: 'D', data: {name: curIUnit.name}});

						iPlayer = _.find(playerArray, {name: _.get(curIUnit, 'playername')});
						if (iPlayer) {
							iCurObj = {
								sessionName: sessionName,
								eventCode: constants.shortNames[eventObj.action],
								iucid: _.get(iPlayer, 'ucid'),
								iName: _.get(curIUnit, 'playername'),
								displaySide: 'A',
								roleCode: 'I',
								msg: 'A: '+ constants.side[_.get(curIUnit, 'coalition')] + ' '+ _.get(curIUnit, 'type') + '(' + _.get(curIUnit, 'playername') +') has crashed',
								groupId: _.get(curIUnit, 'groupId')
							};
							if(_.get(iCurObj, 'iucid')) {
								webPushCommands.sendToAll(serverName, {payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
								masterDBController.simpleStatEventActions('save', serverName, iCurObj);
							}
							masterDBController.srvPlayerActions('clearTempScore', serverName, {_id: _.get(iCurObj, 'iucid'), groupId: _.get(iCurObj, 'groupId')})
								.catch(function (err) {
									console.log('line35', err);
								})
							;

							if (_.get(constants, 'config.inGameHitMessages', true)) {
								DCSLuaCommands.sendMesgToAll(
									serverName,
									_.get(iCurObj, 'msg'),
									5,
									nowTime + _.get(constants, 'time.oneMin', 0)
								);
							}
						}
					}
				})
				.catch(function (err) {
					console.log('err line45: ', err);
				})
			;
		})
		.catch(function (err) {
			console.log('err line1297: ', err);
		})
	;
});
