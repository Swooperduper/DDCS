/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// Occurs whenever an object is hit by a weapon.
// arg1 = id
// arg2 = time
// arg3 = initiatorId
// arg4 = targetId
// arg7 = WeaponId

const _ = require('lodash');
const constants = require('../../constants');
const masterDBController = require('../../db/masterDB');
const DCSLuaCommands = require('../../player/DCSLuaCommands');
const webPushCommands = require('../../socketIO/webPush');
const radioTowerController = require('../../action/radioTower');

exports.shootingUsers = {};

_.set(exports, 'checkShootingUsers', function (serverName) {
	var nowTime = new Date().getTime();
	if(_.keys(exports.shootingUsers).length > 0) {
		_.forEach(exports.shootingUsers, function (user, key) {
			if(_.get(user, ['startTime']) + 3000 < new Date().getTime()){
				var shootObj = _.get(user, ['iCurObj']);
				//_.set(shootObj, 'score', _.get(exports.shootingUsers, [key, 'count'], 1));
				//if (shootObj.score === 1) {
					_.set(shootObj, 'score', 10);
				//}
				if(_.get(shootObj, 'iucid') || _.get(shootObj, 'tucid')) {
					webPushCommands.sendToAll(serverName, {payload: {action: 'S_EVENT_HIT', data: _.cloneDeep(shootObj)}});
					masterDBController.simpleStatEventActions('save', serverName, shootObj);
				}
				if (_.get(exports.shootingUsers, [key, 'isOwnedUnit'], false)) {
					masterDBController.srvPlayerActions('unitAddToRealScore', serverName, {_id: _.get(shootObj, 'iOwnerId'), groupId: _.get(shootObj, 'groupId'), score: _.get(shootObj, 'score'), unitType: _.get(shootObj, 'iType'), unitCoalition: _.get(shootObj, 'iUnitCoalition')})
						.catch(function (err) {
							console.log('line33', err);
						})
					;
				} else {
					masterDBController.srvPlayerActions('addTempScore', serverName, {_id: _.get(shootObj, 'iucid'), groupId: _.get(shootObj, 'groupId'), score: _.get(shootObj, 'score')})
						.catch(function (err) {
							console.log('line39', err);
						})
					;
				}
				if (_.get(shootObj, 'tUnit.category') === 'GROUND') {
					radioTowerController.baseUnitUnderAttack(serverName, _.get(shootObj, 'tUnit'));
					if (_.get(constants, 'config.inGameHitMessages', true)) {
						console.log('shooting1: ', _.get(shootObj, 'msg'));
						DCSLuaCommands.sendMesgToAll(
							serverName,
							'A: ' + _.get(shootObj, 'msg'),
							20,
							nowTime + _.get(constants, 'time.oneMin', 0)
						);
					}
				} else if (_.get(shootObj, 'iUnit.category') === 'GROUND') {
					radioTowerController.baseUnitUnderAttack(serverName, _.get(shootObj, 'tUnit'));
					if (_.get(constants, 'config.inGameHitMessages', true) || _.get(exports.shootingUsers, [key, 'isOwnedUnit'], false)) {
						console.log('shooting2: ', _.get(shootObj, 'msg'));
						DCSLuaCommands.sendMesgToAll(
							serverName,
							'A: ' + _.get(shootObj, 'msg'),
							20,
							nowTime + _.get(constants, 'time.oneMin', 0)
						);
					}
				} else {
					if (_.get(constants, 'config.inGameHitMessages', true)) {
						console.log('shooting3: ', _.get(shootObj, 'msg'));
						DCSLuaCommands.sendMesgToAll(
							serverName,
							'A: ' + _.get(shootObj, 'msg'),
							20,
							nowTime + _.get(constants, 'time.oneMin', 0)
						);
					}
				}
				/*
				if (_.get(shootObj, 'tUnit.category') === 'GROUND') {
					radioTowerController.baseUnitUnderAttack(serverName, _.get(shootObj, 'tUnit'));
					if (_.get(constants, 'config.inGameHitMessages', true)) {
						DCSLuaCommands.sendMesgToGroup(
							_.get(shootObj, 'tUnit.groupId'),
							serverName,
							'G: ' + _.get(shootObj, 'msg'),
							20,
							nowTime + _.get(constants, 'time.oneMin', 0)
						);
					}
				} else if (_.get(shootObj, 'iUnit.category') === 'GROUND') {
					radioTowerController.baseUnitUnderAttack(serverName, _.get(shootObj, 'tUnit'));
					if (_.get(constants, 'config.inGameHitMessages', true) || _.get(exports.shootingUsers, [key, 'isOwnedUnit'], false)) {
						console.log('shooting: ', 'G: Your ' + _.get(shootObj, 'msg'));
						DCSLuaCommands.sendMesgToGroup(
							_.get(shootObj, 'iUnit.groupId'),
							serverName,
							'G: Your ' + _.get(shootObj, 'msg'),
							20,
							nowTime + _.get(constants, 'time.oneMin', 0)
						);
					}
				} else {
					if (_.get(constants, 'config.inGameHitMessages', true)) {
						DCSLuaCommands.sendMesgToAll(
							serverName,
							'A: ' + _.get(shootObj, 'msg'),
							20,
							nowTime + _.get(constants, 'time.oneMin', 0)
						);
					}
				}
				*/
				delete exports.shootingUsers[key];
			}
		});
	}
});

_.set(exports, 'processEventHit', function (serverName, sessionName, eventObj) {
	var iUnitId = _.get(eventObj, 'data.arg3');
	var tUnitId = _.get(eventObj, 'data.arg4');
	var iPName;
	var tPName;
	var iCurObj;
	var iPlayer;
	var tPlayer;
	var nowTime = new Date().getTime();
	// console.log('hit obj: ', serverName, sessionName, eventObj);
	masterDBController.unitActions('read', serverName, {unitId: iUnitId})
		.then(function (iunit) {
			var curIUnit = _.get(iunit, 0);
			masterDBController.unitActions('read', serverName, {unitId: tUnitId})
				.then(function (tunit) {
					var curTUnit = _.get(tunit, 0);
					masterDBController.srvPlayerActions('read', serverName, {sessionName: sessionName})
						.then(function (playerArray) {
							var isOwnedUnit = false;
							var oId = [];
							var iOwnerId = _.get(curIUnit, 'playerOwnerId');
							var tOwnerId = _.get(curTUnit, 'playerOwnerId');

							if (iOwnerId || tOwnerId) {
								if (iOwnerId) {
									oId.push(iOwnerId);
								}
								if (tOwnerId) {
									oId.push(tOwnerId);
								}
							}
							masterDBController.srvPlayerActions('read', serverName, {_id: {$in: oId}})
								.then(function (ownerIds) {
									// console.log('targethit: ', _.get(curTUnit, 'unitId'));
									iCurObj = {
										sessionName: sessionName,
										eventCode: constants.shortNames[eventObj.action],
										iName: _.get(curIUnit, 'playername'),
										iType: _.get(curIUnit, 'type'),
										iOwnerId: iOwnerId,
										tName: _.get(curTUnit, 'playername'),
										tOwnerId: tOwnerId,
										displaySide: 'A',
										roleCode: 'I',
										showInChart: true,
										groupId: _.get(curIUnit, 'groupId'),
										iCoalition: _.get(curIUnit, 'coalition'),
										iUnit: curIUnit,
										tUnit: curTUnit
									};

									_.forEach(ownerIds, function (ownerId) {
										if (ownerId.ucid === iOwnerId) {
											_.set(iCurObj, 'iOwner', ownerId);
											_.set(iCurObj, 'iOwnerName', _.get(ownerId, 'name', ''));
											_.set(iCurObj, 'iOwnerNamePretty', '(' + _.get(ownerId, 'name', '') + ')');
										}
										if (ownerId.ucid === tOwnerId) {
											_.set(iCurObj, 'tOwner', ownerId);
											_.set(iCurObj, 'tOwnerName', _.get(ownerId, 'name', ''));
											_.set(iCurObj, 'tOwnerNamePretty', '(' + _.get(ownerId, 'name', '') + ')');
										}
									});

									if (curIUnit) {
										iPlayer = _.find(playerArray, {name: curIUnit.playername});
										if (iPlayer) {
											_.set(iCurObj, 'iucid', _.get(iPlayer, 'ucid'));
											iPName = _.get(curIUnit, 'type') + '(' + _.get(curIUnit, 'playername') + ')';
										} else {
											iPName = _.get(curIUnit, 'type') + _.get(iCurObj, 'iOwnerNamePretty', '');
											isOwnedUnit = true;
										}
									}

									if (curTUnit ) {
										tPlayer = _.find(playerArray, {name: curTUnit.playername});
										if (tPlayer) {
											_.set(iCurObj, 'tucid', _.get(tPlayer, 'ucid'));
											tPName = _.get(curTUnit, 'type') + '(' + _.get(curTUnit, 'playername') + ')';
										} else {
											tPName = _.get(curTUnit, 'type') + _.get(iCurObj, 'tOwnerNamePretty', '');
										}
									}

									if (_.get(curIUnit, 'coalition', 0) !== _.get(curTUnit, 'coalition', 0)) {
										var curWeapon = _.find(_.get(constants, 'weaponsDictionary'), {_id: _.get(eventObj, ['data', 'arg7', 'typeName'])} );
										// console.log('dcsWeapObj: ', _.get(eventObj, ['data', 'arg7']));
										if(curWeapon){
											var curWeaponName = ( _.get(curWeapon, 'displayName')) ?  _.get(curWeapon, 'displayName') :  _.get(curWeapon, '_id');
											// console.log('CW: ', curWeapon);
											if (_.get(iCurObj, 'iucid') || _.get(iCurObj, 'tucid') || isOwnedUnit) {
												if (_.startsWith(_.get(curWeapon, 'name'), 'weapons.shells')){
													_.set(exports.shootingUsers, [iUnitId, 'count'], _.get(exports.shootingUsers, [iUnitId, 'count'], 0)+1);
													_.set(exports.shootingUsers, [iUnitId, 'startTime'], new Date().getTime());
													_.set(exports.shootingUsers, [iUnitId, 'serverName'], serverName);
													_.set(exports.shootingUsers, [iUnitId, 'isOwnedUnit'], isOwnedUnit);
													_.set(exports.shootingUsers, [iUnitId, 'iUnitType'], _.get(iCurObj, 'iType'));
													_.set(exports.shootingUsers, [iUnitId, 'iUnitCoalition'], _.get(iCurObj, 'iCoalition'));
													_.set(iCurObj, 'msg',
														constants.side[_.get(curIUnit, 'coalition')] + ' '+ iPName +' has hit ' + constants.side[_.get(curTUnit, 'coalition')]+' ' + tPName + ' '+_.get(exports.shootingUsers, [iUnitId, 'count'], 0)+' times with ' + curWeaponName + ' - +10'
													);
													// console.log('2: ', iCurObj.msg); //'+_.get(curWeapon, 'score')+'
													_.set(exports.shootingUsers, [iUnitId, 'iCurObj'], _.cloneDeep(iCurObj));
												} else {
													_.set(iCurObj, 'score', _.get(curWeapon, 'score'));
													_.set(iCurObj, 'msg', constants.side[_.get(curIUnit, 'coalition')] + ' '+ iPName +' has hit ' + constants.side[_.get(curTUnit, 'coalition')] + ' '+tPName + ' with ' + curWeaponName + ' - +'+_.get(curWeapon, 'score'));
													// console.log('3: ', iCurObj.msg);
													if(_.get(iCurObj, 'iucid') || _.get(iCurObj, 'tucid')) {
														webPushCommands.sendToAll(serverName, {payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
														masterDBController.simpleStatEventActions('save', serverName, iCurObj);
													}
													if (isOwnedUnit) {
														masterDBController.srvPlayerActions('unitAddToRealScore', serverName, {_id: _.get(iCurObj, 'iOwnerId'), groupId: _.get(iCurObj, 'groupId'), score: _.get(iCurObj, 'score'), unitType: _.get(iCurObj, 'iType'), unitCoalition: _.get(iCurObj, 'iCoalition')})
															.catch(function (err) {
																console.log('line147', err);
															})
														;
													} else {
														masterDBController.srvPlayerActions('addTempScore', serverName, {_id: _.get(iCurObj, 'iucid'), groupId: _.get(iCurObj, 'groupId'), score: _.get(iCurObj, 'score')})
															.catch(function (err) {
																console.log('line147', err);
															})
														;
													}
													if (_.get(iCurObj, 'tUnit.category') === 'GROUND') {
														radioTowerController.baseUnitUnderAttack(serverName, _.get(iCurObj, 'tUnit'));
														if (_.get(constants, 'config.inGameHitMessages', true)) {
															console.log('groundhit: ', _.get(iCurObj, 'msg'));
															DCSLuaCommands.sendMesgToAll(
																serverName,
																'A: ' + _.get(iCurObj, 'msg'),
																20,
																nowTime + _.get(constants, 'time.oneMin', 0)
															);
														}
													} else if (_.get(iCurObj, 'iUnit.category') === 'GROUND') {
														if (_.get(constants, 'config.inGameHitMessages', true) || isOwnedUnit) {
															console.log('groundrecievehit: ', _.get(iCurObj, 'msg'));
															DCSLuaCommands.sendMesgToAll(
																serverName,
																'A: ' + _.get(iCurObj, 'msg'),
																20,
																nowTime + _.get(constants, 'time.oneMin', 0)
															);
														}
													} else {
														if (_.get(constants, 'config.inGameHitMessages', true)) {
															console.log('reg hit: ', _.get(iCurObj, 'msg'));
															DCSLuaCommands.sendMesgToAll(
																serverName,
																'A: ' + _.get(iCurObj, 'msg'),
																20,
																nowTime + _.get(constants, 'time.oneMin', 0)
															);
														}
													}


													/*
													if (_.get(iCurObj, 'tUnit.category') === 'GROUND') {
														radioTowerController.baseUnitUnderAttack(serverName, _.get(iCurObj, 'tUnit'));
														if (_.get(constants, 'config.inGameHitMessages', true)) {
															console.log('singleHit1: ', 'G: Your ' + _.get(iCurObj, 'msg'));
															// console.log('FiredAt: ', _.get(iCurObj, 'tUnit.groupId'));
															DCSLuaCommands.sendMesgToGroup(
																_.get(iCurObj, 'tUnit.groupId'),
																serverName,
																'G: ' + _.get(iCurObj, 'msg'),
																20,
																nowTime + _.get(constants, 'time.oneMin', 0)
															);
														}
													} else if (_.get(iCurObj, 'iUnit.category') === 'GROUND') {
														if (_.get(constants, 'config.inGameHitMessages', true) || isOwnedUnit) {
															console.log('singleHit2: ', 'G: Your ' + _.get(iCurObj, 'msg'));
															// console.log('FiredBy: ', _.get(iCurObj, 'iUnit.groupId'));
															DCSLuaCommands.sendMesgToGroup(
																_.get(iCurObj, 'iUnit.groupId'),
																serverName,
																'G: Your ' + _.get(iCurObj, 'msg'),
																20,
																nowTime + _.get(constants, 'time.oneMin', 0)
															);
														}
													} else {
														if (_.get(constants, 'config.inGameHitMessages', true)) {
															DCSLuaCommands.sendMesgToAll(
																serverName,
																'A: ' + _.get(iCurObj, 'msg'),
																20,
																nowTime + _.get(constants, 'time.oneMin', 0)
															);
														}
													}
												*/
												}
											}
										} else {
											var shotCount;
											var shotpoints;
											// console.log('weapon not here');
											console.log('Weapon Unknown: ', _.get(eventObj, ['data', 'arg7', 'typeName']));
											_.set(exports.shootingUsers, [iUnitId, 'count'], _.get(exports.shootingUsers, [iUnitId, 'count'], 0)+1);
											_.set(exports.shootingUsers, [iUnitId, 'startTime'], new Date().getTime());
											_.set(exports.shootingUsers, [iUnitId, 'serverName'], serverName);
											_.set(exports.shootingUsers, [iUnitId, 'isOwnedUnit'], isOwnedUnit);
											_.set(exports.shootingUsers, [iUnitId, 'iUnitType'], _.get(iCurObj, 'iType'));
											_.set(exports.shootingUsers, [iUnitId, 'iUnitCoalition'], _.get(iCurObj, 'iCoalition'));
											shotCount = _.get(exports.shootingUsers, [iUnitId, 'count'], 1);
											if (shotCount === 1) {
												shotpoints = 10;
											} else {
												shotpoints = shotCount
											}
											_.set(iCurObj, 'msg',
												'A: '+ constants.side[_.get(curIUnit, 'coalition')] + ' '+ iPName +' has hit ' + constants.side[_.get(curTUnit, 'coalition')] + ' ' + tPName + ' '+shotCount+' times with ? - +10'
											);
											// console.log('4: ', iCurObj.msg); // + shotpoints
											_.set(exports.shootingUsers, [iUnitId, 'iCurObj'], _.cloneDeep(iCurObj));
										}
									}
								})
								.catch(function (err) {
									console.log('err line170: ', err);
								})
							;
						})
						.catch(function (err) {
							console.log('err line45: ', err);
						})
					;
				})
				.catch(function (err) {
					console.log('err line170: ', err);
				})
			;
		})
		.catch(function (err) {
			console.log('err line182: ', err);
		})
	;
});
