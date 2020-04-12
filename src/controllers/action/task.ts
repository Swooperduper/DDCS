/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const	_ = require('lodash');
const constants = require('../constants');
const masterDBController = require('../db/masterDB');

var delayTask = _.get(constants, 'time.oneMin');
var nowTime;

exports.ewrUnitsActivated = {};

_.set(exports, 'setEWRTask', function (serverName, unitName) {
	nowTime = new Date().getTime();
	var sendClient = {
		action: 'ADDTASK',
		taskType: 'EWR',
		unitName: unitName
	};
	var actionObj = {
		actionObj: sendClient,
		queName: 'clientArray',
		timeToExecute: nowTime + delayTask
	};
	return masterDBController.cmdQueActions('save', serverName, actionObj)
		.catch(function (err) {
			console.log('erroring line13: ', err);
		})
	;
});
_.set(exports, 'setMissionTask', function (serverName, groupName, route) {
	nowTime = new Date().getTime();
	// console.log('NT: ', delayTask, nowTime);
	var sendClient = {
		action: 'ADDTASK',
		taskType: 'Mission',
		groupName: groupName,
		route: route
	};
	var actionObj = {
		actionObj: sendClient,
		queName: 'clientArray',
		timeToExecute: nowTime + delayTask
	};
	return masterDBController.cmdQueActions('save', serverName, actionObj)
		.catch(function (err) {
			console.log('erroring line13: ', err);
		})
	;
});
