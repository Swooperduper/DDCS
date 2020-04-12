/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const constants = require('../constants');
const masterDBController = require('../db/masterDB');
const zoneController = require('../proxZone/zone');
const groupController = require('../spawn/group');


_.set(exports, 'spawnLogiCrate', function (serverName, crateObj, init) {
	if (init) {
		_.set(crateObj, '_id', crateObj.name);
		_.set(crateObj, 'lonLatLoc',  zoneController.getLonLatFromDistanceDirection(_.get(crateObj, ['unitLonLatLoc']), crateObj.heading, 0.05));
		masterDBController.staticCrateActions('save', serverName, crateObj)
			.then(function () {
				var curCMD = groupController.spawnStatic(serverName, groupController.staticTemplate(crateObj), crateObj.country, crateObj.name, true);
				var sendClient = {action: "CMD", cmd: curCMD, reqID: 0};
				var actionObj = {actionObj: sendClient, queName: 'clientArray'};
				masterDBController.cmdQueActions('save', serverName, actionObj)
					.catch(function (err) {
						console.log('erroring line23: ', err);
					})
				;
			})
			.catch(function (err) {
				console.log('erroring line17: ', err);
			})
		;
	} else {
		var curCMD = groupController.spawnStatic(serverName, groupController.staticTemplate(crateObj), crateObj.country, crateObj.name, true);
		var sendClient = {action: "CMD", cmd: curCMD, reqID: 0};
		var actionObj = {actionObj: sendClient, queName: 'clientArray'};
		masterDBController.cmdQueActions('save', serverName, actionObj)
			.catch(function (err) {
				console.log('erroring line37: ', err);
			})
		;
	}
});

