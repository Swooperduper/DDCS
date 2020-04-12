/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const masterDBController = require('../db/masterDB');
const groupController = require('../spawn/group');
const DCSLuaCommands = require('../player/DCSLuaCommands');
const crateController = require('../spawn/crate');
const sideLockController = require('../action/sideLock');
const taskController = require('../action/task');
const baseSpawnFlagsController = require('../action/baseSpawnFlags');
const serverTimerController = require('../action/serverTimer');
const f10MarksController = require('../action/f10Marks');
const unitsStaticsController = require('../../controllers/serverToDbSync/unitsStatics');
const resetCampaignController = require('../action/resetCampaign');

var mesg;
var masterUnitCount;
var lastUnitCount;
var isServerFresh = false;
var stuckThreshold = 30;
exports.isServerSynced = false;
exports.isSyncLockdownMode = false; //lock all processes out until server fully syncs
exports.processInstructions = false;

_.set(exports, 'syncServer', function(serverName, serverUnitCount) {
	var remappedunits = {};
	masterDBController.unitActions('readStd', serverName, {dead: false})
		.then(function (units) {
			if (serverUnitCount === 0) { //server is empty
				unitsStaticsController.lockUpdates = false;
				taskController.ewrUnitsActivated = {};
				exports.isServerSynced = false;
				isServerFresh = true;
				if (!exports.isSyncLockdownMode) {
					serverTimerController.resetTimerObj();
					exports.isSyncLockdownMode = true; // lock down all traffic until sync is complete
					if (units.length === 0) { // DB is empty
						console.log('DB & Server is empty of Units, Spawn New Units');
						var newCampaignName = serverName + '_' + new Date().getTime();
						masterDBController.campaignsActions('save', serverName, {_id: newCampaignName, name: newCampaignName})
							.then(function () {
								masterDBController.sessionsActions('save', serverName, {_id: newCampaignName, name: newCampaignName, campaignName: newCampaignName})
									.then(function () {
										masterUnitCount = groupController.spawnNewMapGrps(serverName); //respond with server spawned num
										exports.processInstructions = true;
										console.log('processed Instructons 1: ', exports.processInstructions);
									})
									.catch(function (err) {
										console.log('line49', err);
									})
								;
							})
							.catch(function (err) {
								console.log('erroring line59: ', err);
							})
						;
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
								!_.get(unit, 'isTroop', false) &&
								!_.get(unit, 'isAI', false)
							) {
								_.set(remappedunits, [curGrpName], _.get(remappedunits, [curGrpName], []));
								remappedunits[curGrpName].push(unit);
							} else if (_.get(unit, 'type') === '.Command Center') {
								groupController.spawnLogisticCmdCenter(serverName, unit, true);
							} else if (_.get(unit, 'type') === 'Comms tower M') {
								groupController.spawnRadioTower(serverName, unit, true);
							} else {
								// console.log('marking unit dead: ', unit);
								curDead = {
									_id: _.get(unit, 'name'),
									name: _.get(unit, 'name'),
									dead: true
								};
								masterDBController.unitActions('update', serverName, curDead)
									.catch(function (err) {
										console.log('erroring line90: ', err);
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
			console.log('erroring line206: ', err);
		})
	;
});

_.set(exports, 'syncType', function (serverName, serverUnitCount) {

	if (serverUnitCount > -1) {
		// check if server should be reset
		masterDBController.serverActions('read', {_id: serverName})
			.then(function(servers) {
				if(servers.length > 0) {
					var curServer = _.first(servers);
					// console.log('t: ', _.get(curServer, 'resetFullCampaign', false), ' && ', serverUnitCount === 0);
					if (_.get(curServer, 'resetFullCampaign', false) && serverUnitCount === 0) {
						resetCampaignController.clearCampaignTables(serverName)
							.then(function() {
								masterDBController.serverActions('update', {name: serverName, resetFullCampaign: false})
									.then(function () {
										exports.syncServer(serverName, serverUnitCount);
									})
									.catch(function (err) {
										console.log('erroring line220: ', err);
									})
								;
							})
							.catch(function (err) {
								console.log('erroring line225: ', err);
							})
						;
					} else {
						exports.syncServer(serverName, serverUnitCount);
					}
				}
			})
			.catch(function (err) {
				console.log('erroring line206: ', err);
			})
		;
	}
});
