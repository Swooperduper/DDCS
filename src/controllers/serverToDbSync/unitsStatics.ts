/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const masterDBController = require('../db/masterDB');
const taskController = require('../action/task');
const webPushCommands = require('../socketIO/webPush');
const menuUpdateController = require('../menu/menuUpdate');
const f10MarksController = require('../action/f10Marks');

exports.lockUpdates = false;

_.set(exports, 'processUnitUpdates', function (serverName, sessionName, unitObj) {
	if (!exports.lockUpdates) {
		masterDBController.unitActions('read', serverName, {_id: _.get(unitObj, 'data.name')})
			.then(function (unit) {
				var stParse;
				var iCurObj;
				var curUnit = _.get(unit, 0, {});
				var curUnitName = _.get(curUnit, 'name');
				var curData = _.get(unitObj, 'data');
				if (!_.includes(curData.name, 'New Static Object')) {
					// build out extra info on spawned items isAI
					if (_.includes(curData.name, 'AI|')) {
						stParse = _.split(curData.name, '|');
						_.set(curData, 'playerOwnerId', stParse[1]);
						_.set(curData, 'isAI', true);
						_.set(curData, 'hidden', false);
					}
					if (_.includes(curData.name, 'TU|')) {
						stParse = _.split(curData.name, '|');
						_.set(curData, 'playerOwnerId', stParse[1]);
						_.set(curData, 'playerCanDrive', false);
						_.set(curData, 'isTroop', true);
						_.set(curData, 'spawnCat', stParse[2]);
					}
					if (_.includes(curData.name, 'CU|')) {
						stParse = _.split(curData.name, '|');
						_.set(curData, 'playerOwnerId', stParse[1]);
						_.set(curData, 'isCombo', _.isBoolean(stParse[5]));
						_.set(curData, 'playerCanDrive', false);
						_.set(curData, 'isCrate', true);
						_.set(curData, 'hidden', false);
					}
					if (_.includes(curData.name, 'DU|')) {
						stParse = _.split(curData.name, '|');
						_.set(curData, 'playerOwnerId', stParse[1]);
						_.set(curData, 'proxChkGrp', stParse[3]);
						_.set(curData, 'playerCanDrive', stParse[5]);
					}

					//update location of carrier in aircraft DB
					if (_.includes(curData.name, 'Carrier')) {
						masterDBController.baseActions('update', serverName, {_id: curUnitName, centerLoc: curData.lonLatLoc});
					}

					if (curData.playername && (_.get(unitObj, 'action') === 'C')) {
						// console.log('playername', unitObj);
						menuUpdateController.logisticsMenu('resetMenu', serverName, unitObj.data);
					}

					/*
					//set ewr task to ewr if new
									if (curUnit.type === '1L13 EWR' || curUnit.type === '55G6 EWR' || curUnit.type === 'Dog Ear radar') {
											if (!_.get(taskController, ['ewrUnitsActivated', curUnitName], false)) {
													console.log('Set ewr for: ', curUnitName );
													taskController.setEWRTask(serverName, curUnitName);
													_.set(taskController, ['ewrUnitsActivated', curUnitName], true);
											}
									}
									*/

					if ((!_.isEmpty(curUnit) && _.get(unitObj, 'action') !== 'D')) {
						// console.log('updateIDs: ', _.get(curData, 'unitId'));
						iCurObj = {
							action: 'U',
							sessionName: sessionName,
							data: {
								_id: _.get(curData, 'name'),
								alt: parseFloat(_.get(curData, 'alt')),
								agl: parseFloat(_.get(curData, 'agl', 0)),
								dead: false,
								hdg: parseFloat(_.get(curData, 'hdg')),
								groupId: _.get(curData, 'groupId', 0),
								inAir: _.get(curData, 'inAir'),
								name: _.get(curData, 'name'),
								lonLatLoc: _.get(curData, 'lonLatLoc'),
								playername: _.get(curData, 'playername', ''),
								speed: parseFloat(_.get(curData, 'speed', 0)),
								unitId: _.get(curData, 'unitId', 0)
							}
						};
						if(_.get(curData, 'type')) {
							_.set(iCurObj, 'data.type', curData.type);
						}
						if(_.get(curData, 'ammo')) {
							_.set(iCurObj, 'data.ammo', curData.ammo);
						}
						if(_.get(curData, 'coalition')) {
							_.set(iCurObj, 'data.coalition', curData.coalition);
						} else {
							_.set(iCurObj, 'data.coalition', curUnit.coalition);
						}
						if(_.get(curData, 'country')) {
							_.set(iCurObj, 'data.country', curData.country);
						}
						masterDBController.unitActions('update', serverName, iCurObj.data)
							.then(function () {
								var sObj = {
									action: 'U',
									data: {
										_id: iCurObj.data._id,
										lonLatLoc: iCurObj.data.lonLatLoc,
										alt: iCurObj.data.alt,
										agl: iCurObj.data.agl,
										hdg: iCurObj.data.hdg,
										speed: iCurObj.data.speed,
										coalition: iCurObj.data.coalition
									}
								};
								webPushCommands.sendToCoalition(serverName, {payload: sObj});
								//curServers[serverName].updateQue['q' + _.get(curUnit, ['coalition'])].push(_.cloneDeep(iCurObj));
								//curServers[serverName].updateQue.qadmin.push(_.cloneDeep(iCurObj));
								if (curData.category === 'STRUCTURE') {
									// console.log('SUM: ', curData);
									f10MarksController.setUnitMark(serverName, curData);
								}
							})
							.catch(function (err) {
								console.log('update err line626: ', err);
							})
						;
					}else if (_.get(unitObj, 'action') === 'C') {
						if (_.get(curData, 'name')) {
							_.set(curData, '_id', _.get(curData, 'name'));
							iCurObj = {
								action: 'C',
								sessionName: sessionName,
								data: curData
							};
							if (curData.category === 'STRUCTURE') {
								if( _.includes(curData.name, ' Logistics')) {
									_.set(curData, 'proxChkGrp', 'logisticTowers');
								}
							}
							masterDBController.unitActions('save', serverName, iCurObj.data)
								.then(function (unit) {
									var sObj = {
										action: 'C',
										data: {
											_id: iCurObj.data._id,
											lonLatLoc: iCurObj.data.lonLatLoc,
											alt: iCurObj.data.alt,
											agl: iCurObj.data.agl,
											hdg: iCurObj.data.hdg,
											speed: iCurObj.data.speed,
											coalition: iCurObj.data.coalition,
											type: iCurObj.data.type,
											playername: iCurObj.data.playername,
											playerOwnerId: iCurObj.data.playerOwnerId
										}
									};
									webPushCommands.sendToCoalition(serverName, {payload: sObj});
									//curServers[serverName].updateQue['q' + parseFloat(_.get(unitObj, 'data.coalition'))].push(_.cloneDeep(iCurObj));
									//curServers[serverName].updateQue.qadmin.push(_.cloneDeep(iCurObj));
									if (curData.category === 'STRUCTURE') {
										// console.log('SUM: ', curData);
										f10MarksController.setUnitMark(serverName, curData);
									}
								})
								.catch(function (err) {
									console.log('save err line95: ', err, iCurObj.data);
								})
							;
						}
					} else if (_.get(unitObj, 'action') === 'D') {
						/*
											if (_.get(ewrUnitsActivated, [curUnitName], false)) {
													console.log('Delete ewr for: ', curUnitName );
													_.set(ewrUnitsActivated, [curUnitName], false);
											}
											*/
						if (_.get(curData, 'name')) {
							iCurObj = {
								action: 'D',
								sessionName: sessionName,
								data: {
									_id: _.get(curData, 'name'),
									name: _.get(curData, 'name'),
									troopType: null,
									intCargoType: null,
									virtCrateType: null,
									dead: true
								}
							};

							if(_.get(curData, 'coalition')) {
								_.set(iCurObj, 'data.coalition', _.get(curData, 'coalition'));
							}

							masterDBController.unitActions('update', serverName, iCurObj.data)
								.then(function (unit) {
									_.set(iCurObj, 'data.coalition', _.get(iCurObj, 'data.coalition', curUnit.coalition));
									if (_.get(iCurObj, 'data.coalition')) {
										// console.log('get side: ', _.get(iCurObj, 'data.coalition'));
										webPushCommands.sendToCoalition(serverName, {payload: _.cloneDeep(iCurObj)});
									}
									// curServers[serverName].updateQue.q1.push(_.cloneDeep(iCurObj));
									// curServers[serverName].updateQue.q2.push(_.cloneDeep(iCurObj));
									// curServers[serverName].updateQue.qadmin.push(_.cloneDeep(iCurObj));
								})
								.catch(function (err) {
									console.log('del err line123: ', err);
								})
							;
						} else {
							console.log('is not a number: ', _.get(curData, 'unitId'), curData);
						}
					}
				}
			})
			.catch(function (err) {
				console.log('err line129: ', err);
			})
		;
	}
});
