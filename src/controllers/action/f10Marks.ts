/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const	_ = require('lodash');
const constants = require('../constants');
const masterDBController = require('../db/masterDB');

_.assign(exports, {
	setFarpMarks: function (serverName) {
		masterDBController.baseActions('read', serverName, {_id: {$not: /#/}})
			.then(function (bases) {
				_.forEach(bases, function (base) {
					if (_.get(base, 'baseMarkId')) {
						var curCMD = 'trigger.action.removeMark(' + _.get(base, 'baseMarkId') + ')';
						var sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
						var actionObj = {actionObj: sendClient, queName: 'clientArray'};
						masterDBController.cmdQueActions('save', serverName, actionObj)
							.then(function () {
								var randomMarkId = _.random(1000, 9999);
								var curCMD = 'trigger.action.markToAll(' +
									randomMarkId + ', [[' +
									_.get(base, 'name') + ']], ' +
									'coord.LLtoLO(' + _.get(base, ['centerLoc', 1]) + ', ' + _.get(base, ['centerLoc', 0]) + ')' +
									', true)';
								var sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
								var actionObj = {actionObj: sendClient, queName: 'clientArray'};
								masterDBController.cmdQueActions('save', serverName, actionObj)
									.then(function () {
										masterDBController.baseActions('update', serverName, {_id: _.get(base, 'name'), baseMarkId: randomMarkId})
											.catch(function (err) {
												console.log('erroring line32: ', err);
											})
										;
									})
									.catch(function (err) {
										console.log('erroring line13: ', err);
									})
								;
							})
							.catch(function (err) {
								console.log('erroring line13: ', err);
							})
						;
					} else {
						var randomMarkId = _.random(1000, 9999);
						var curCMD = 'trigger.action.markToAll(' +
							randomMarkId + ', [[' +
							_.get(base, 'name') + ']], ' +
							'coord.LLtoLO(' + _.get(base, ['centerLoc', 1]) + ', ' + _.get(base, ['centerLoc', 0]) + ')' +
							', true)';
						var sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
						var actionObj = {actionObj: sendClient, queName: 'clientArray'};
						masterDBController.cmdQueActions('save', serverName, actionObj)
							.then(function () {
								masterDBController.baseActions('update', serverName, {_id: _.get(base, 'name'), baseMarkId: randomMarkId})
									.catch(function (err) {
										console.log('erroring line58: ', err);
									})
								;
							})
							.catch(function (err) {
								console.log('erroring line13: ', err);
							})
						;
					}
				});
			})
			.catch(function (err) {
				console.log('line168', err);
			})
		;
	},
	setUnitMark: function (serverName, unit) {
		// console.log('unitPOP: ', !_.includes(_.get(constants, 'crateTypes'), _.get(unit, 'type')), unit);
		if (!_.includes(_.get(constants, 'crateTypes'), _.get(unit, 'type'))) {
			masterDBController.unitActions('read', serverName, {_id: _.get(unit, 'name')})
				.then(function (cUnit) {
					var curUnit = _.first(cUnit);
					// console.log('SETUNITMARK: ', curUnit, cUnit);
					if (_.get(curUnit, 'markId')) {
						var curCMD = 'trigger.action.removeMark(' + _.get(curUnit, 'markId') + ')';
						var sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
						var actionObj = {actionObj: sendClient, queName: 'clientArray'};
						masterDBController.cmdQueActions('save', serverName, actionObj)
							.then(function () {
								var randomMarkId = _.random(1000, 9999);
								var curCMD = 'trigger.action.markToCoalition(' +
									randomMarkId + ', [[' +
									_.get(curUnit, 'name') + ']], ' +
									'coord.LLtoLO(' + _.get(curUnit, ['lonLatLoc', 1]) + ', ' + _.get(curUnit, ['lonLatLoc', 0]) + '), ' +
									' ' + _.get(curUnit, 'coalition') + ',' +
									' true)';
								var sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
								var actionObj = {actionObj: sendClient, queName: 'clientArray'};
								masterDBController.cmdQueActions('save', serverName, actionObj)
									.then(function () {
										masterDBController.unitActions('update', serverName, {_id: _.get(curUnit, '_id'), markId: randomMarkId})
											.catch(function (err) {
												console.log('erroring line99: ', err);
											})
										;
									})
									.catch(function (err) {
										console.log('erroring line13: ', err);
									})
								;
							})
							.catch(function (err) {
								console.log('erroring line13: ', err);
							})
						;
					} else {
						var randomMarkId = _.random(1000, 9999);
						var curCMD = 'trigger.action.markToCoalition(' +
							randomMarkId + ', [[' +
							_.get(curUnit, 'name') + ']], ' +
							'coord.LLtoLO(' + _.get(curUnit, ['lonLatLoc', 1]) + ', ' + _.get(curUnit, ['lonLatLoc', 0]) + '),' +
							' ' + _.get(curUnit, 'coalition') + ',' +
							' true)';
						var sendClient = {action: "CMD", cmd: [curCMD], reqID: 0};
						var actionObj = {actionObj: sendClient, queName: 'clientArray'};
						masterDBController.cmdQueActions('save', serverName, actionObj)
							.then(function () {
								masterDBController.unitActions('update', serverName, {_id: _.get(curUnit, '_id'), markId: randomMarkId})
									.catch(function (err) {
										console.log('erroring line126: ', err);
									})
								;
							})
							.catch(function (err) {
								console.log('erroring line13: ', err);
							})
						;
					}
					//console.log('CMD: ', curCMD);
				})
				.catch(function (err) {
					console.log('erroring line138: ', err);
				})
			;
		}
	}
});
