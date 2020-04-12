/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const masterDBController = require('../db/masterDB');
const groupController = require('../spawn/group');
const DCSLuaCommands = require('../player/DCSLuaCommands');
const menuUpdateController = require('../menu/menuUpdate');
const crateController = require('../spawn/crate');
const sideLockController = require('../action/sideLock');
const taskController = require('../action/task');
const baseSpawnFlagsController = require('../action/baseSpawnFlags');
const serverTimerController = require('../action/serverTimer');
const f10MarksController = require('../action/f10Marks');

_.set(exports, 'synchronizeServer', function (serverName, serverUnitCount) {
	//process updates but allow full server interaction while this goes on (units might be killing each other on spawn in)
	//get server state, request Active Flag from lua socket
	if(isServerActive) {
		//request full unit record update from server, server is master DB
		if(dbUnitCount !== serverUnitCount && 10secs passes in this state) {
			//request full unit record update from server, server is master DB
			// reset wait to 0
		}
	} else {
		if(isServerDbEmpty) {
			//repop full server
			// 1. build lua commands, load up que
			// 2. wait for repop detection in game with update, create, delete packets
			if(serverUnitCount > lastServerUnitCount) {
				//reset wait count
			} else {
				if(dbUnitCount === serverUnitCount  && 10secs passes in this state) {
					//Open Server Up For Playing, set flags (open slots up)
				} else {
					//count 30secs to wait for straggler spawn commands
					//if 30 secs passes with no change, send command to reload mission, start process over
				}
			}
		} else {
			//repop database units
			//1. send units to server to repop all of them
			if(serverUnitCount > lastServerUnitCount) {
				//reset wait count
			} else {
				if(dbUnitCount === serverUnitCount && 10secs passes in this state) {
					//Open Server Up For Playing, set flags (open slots up)
				} else {
					//count 30secs to wait for straggler spawn commands
					//if 30 secs passes with no change, send command to reload mission, clear lua socket cmd que, start process over
				}
			}
		}
	}

});





var mesg;
var masterUnitCount;
var lastUnitCount;
var isServerFresh = false;
var stuckThreshold = 30;
exports.isServerSynced = false;
exports.isSyncLockdownMode = false; //lock all processes out until server fully syncs
exports.processInstructions = false;

_.set(exports, 'syncType', function (serverName, serverUnitCount) {
	var remappedunits = {};
	if (serverUnitCount > -1) {
		// console.log('start: ', serverName, serverUnitCount);
		masterDBController.unitActions('readStd', serverName, {dead: false})
			.then(function (units) {
				if (serverUnitCount === 0) { //server is empty
					taskController.ewrUnitsActivated = {};
					exports.isServerSynced = false;
					isServerFresh = true;
					if (!exports.isSyncLockdownMode) {
						serverTimerController.resetTimerObj();
						exports.isSyncLockdownMode = true; // lock down all traffic until sync is complete
						masterDBController.cmdQueActions('removeall', serverName, {})
							.then(function () {
								if (units.length === 0) { // DB is empty
									console.log('DB & Server is empty of Units, Spawn New Units');
									masterUnitCount = groupController.spawnNewMapGrps(serverName); //respond with server spawned num
									exports.processInstructions = true;
									console.log('processed Instructons 1: ', exports.processInstructions);
								} else { // DB is FULL
									console.log('DB has ' + units.length + ' Units, Respawn Them');
									var filterStructure = _.filter(units, {category: 'STRUCTURE'});
									var filterGround = _.filter(units, {category: 'GROUND'});
									var filterShips = _.filter(units, {category: 'SHIP'});
									masterUnitCount = filterStructure.length + filterGround.length;
									_.forEach(units, function (unit) {
										var curDead;
										var curGrpName = _.get(unit, 'groupName');
										if (
											(_.get(unit, 'category') === 'GROUND') &&
											!_.get(unit, 'isTroop', false)
										) {
											_.set(remappedunits, [curGrpName], _.get(remappedunits, [curGrpName], []));
											remappedunits[curGrpName].push(unit);
										} else if (_.get(unit, 'type') === '.Command Center') {
											groupController.spawnLogisticCmdCenter(serverName, unit, true);
										} else if (_.get(unit, 'type') === 'Comms tower M') {
											groupController.spawnRadioTower(serverName, unit, true);
										} else {
											console.log('marking unit dead: ', unit);
											curDead = {
												_id: _.get(unit, 'name'),
												name: _.get(unit, 'name'),
												dead: true
											};
											masterDBController.unitActions('update', serverName, curDead)
												.catch(function (err) {
													console.log('erroring line36: ', err);
												})
											;
										}
									});
									_.forEach(remappedunits, function (group) {
										groupController.spawnGroup(serverName, group)
									});
									masterDBController.staticCrateActions('read', serverName, {})
										.then(function(staticCrates) {
											_.forEach(staticCrates, function (crateObj) {
												crateController.spawnLogiCrate(serverName, crateObj, false);
											});
										})
										.catch(function (err) {
											console.log('line 70: ', err);
										})
									;
								}
								exports.processInstructions = true;
								console.log('processed Instructons 2: ', exports.processInstructions);
							})
							.catch(function (err) {
								console.log('line 84: ', err);
							})
						;
					} else {
						console.log('syncro mode is on lockdown: ', exports.isSyncLockdownMode);
					}
				} else {
					if (isServerFresh) { // server is fresh
						taskController.ewrUnitsActivated = {};
						if (exports.processInstructions) {
							if (serverUnitCount !== units.length) {
								if (lastUnitCount === serverUnitCount) {
									if (stuckDetect > 5) {
										mesg = 'STUCK|' + stuckDetect + '|F|' + units.length + ':' + serverUnitCount + ':' + exports.isServerSynced + ':' + exports.isSyncLockdownMode;
									} else {
										mesg = 'SYNCING|F|' + units.length + ':' + serverUnitCount;
									}
									if (stuckDetect > stuckThreshold) {
										masterDBController.cmdQueActions('save', serverName, {
											queName: 'clientArray',
											actionObj: {action: "GETUNITSALIVE"},
										});
										stuckDetect = 0;
									} else {
										stuckDetect++;
									}
								} else {
									stuckDetect = 0;
									lastUnitCount = serverUnitCount;
									mesg = 'SYNCING|F|' + units.length + ':' + serverUnitCount;
								}
								console.log(mesg);
								DCSLuaCommands.sendMesgChatWindow(serverName, mesg);
								exports.isServerSynced = false;
							} else {
								if (!exports.isServerSynced && units.length > 50) {
									mesg = 'Server units are Synced, Slots Now Open!';
									console.log(mesg);
									DCSLuaCommands.sendMesgChatWindow(serverName, mesg);
									exports.isServerSynced = true;
									isServerFresh = false;
									DCSLuaCommands.setIsOpenSlotFlag(serverName, 1);
									sideLockController.setSideLockFlags(serverName);
									baseSpawnFlagsController.setbaseSides(serverName);
									f10MarksController.setFarpMarks(serverName);
								} else {
									console.log('failing  !exports.isServerSynced && units.length > 50', !exports.isServerSynced, ' && ', units.length > 100);
								}
							}
						} else {
							console.log('No Sync Instructions to be processed', exports.processInstructions);
						}
					} else { // server has units on it
						if (units.length !== serverUnitCount) { // db doesnt match server
							if (lastUnitCount === serverUnitCount) {
								if (stuckDetect > 5) {
									mesg = 'STUCK|' + stuckDetect + '|R1|' + units.length + ':' + serverUnitCount + ':' + exports.isServerSynced + ':' + exports.isSyncLockdownMode;
								} else {
									mesg = 'SYNCING|R1|' + units.length + ':' + serverUnitCount;
								}
								if (stuckDetect > stuckThreshold) {
									masterDBController.cmdQueActions('save', serverName, {
										queName: 'clientArray',
										actionObj: {action: "GETUNITSALIVE"},
									});
									stuckDetect = 0;
								} else {
									stuckDetect++;
								}
							} else {
								stuckDetect = 0;
								lastUnitCount = serverUnitCount;
								mesg = 'SYNCING|R2|' + units.length + ':' + serverUnitCount;
							}
							exports.isServerSynced = true;
							console.log(mesg);
							// DCSLuaCommands.sendMesgChatWindow(serverName, mesg);
							// exports.isServerSynced = true;
						} else {
							if (!exports.isServerSynced && units.length > 50) {
								mesg = 'Server units Synced';
								console.log(mesg);
								//DCSLuaCommands.sendMesgChatWindow(serverName, mesg);
								exports.isServerSynced = true;
								DCSLuaCommands.setIsOpenSlotFlag(serverName, 1);
								baseSpawnFlagsController.setbaseSides(serverName);
								f10MarksController.setFarpMarks(serverName);
							}
						}
					}
				}
			})
			.catch(function (err) {
				console.log('erroring line59: ', err);
			})
		;
	}
});
