/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const	_ = require('lodash');
const masterDBController = require('../db/masterDB');
const proximityController = require('../proxZone/proximity');
const groupController = require('../spawn/group');
const DCSLuaCommands = require('../player/DCSLuaCommands');
const baseSpawnFlagsController = require('../action/baseSpawnFlags');

var mainNeutralBases;
_.assign(exports, {
	checkCmdCenters: function (serverName) {
		var basesChanged = false;
		var curSide;
		masterDBController.baseActions('read', serverName, {baseType: "FOB", enabled: true})
			.then(function (bases) {
				_.forEach(bases, function (base) {
					masterDBController.unitActions('read', serverName, {_id: base.name + ' Logistics', dead: false})
						.then(function (isCCExist) {
							if (isCCExist.length > 0) {
								curSide = _.get(_.first(isCCExist), 'coalition');
								if (_.get(base, 'side') !==  curSide) {
									basesChanged = true;
									masterDBController.baseActions('updateSide', serverName, {name: base.name, side: curSide})
										.catch(function (err) {
											console.log('erroring line162: ', err);
										})
									;
								}
							} else {
								if (_.get(base, 'side') !==  0) {
									basesChanged = true;
									masterDBController.baseActions('updateSide', serverName, {name: base.name, side: 0})
										.catch(function (err) {
											console.log('erroring line162: ', err);
										})
									;
								}
							}
						})
						.catch(function (err) {
							console.log('erroring line162: ', err);
						})
					;
				});
				if (basesChanged) {
					baseSpawnFlagsController.setbaseSides(serverName);
				}
			})
			.catch(function (err) {
				console.log('line 1303: ', err);
			})
		;
	},
	spawnCCAtNeutralBase: function (serverName, curPlayerUnit) {
		// console.log('spwnNeutral: ', curPlayerUnit);
		return new Promise(function(resolve, reject) {
			masterDBController.baseActions('read', serverName, {baseType: "FOB", enabled: true})
				.then(function (bases) {
					mainNeutralBases = _.remove(bases, function (base) {
						return !_.includes(base.name, '#');
					});
					// console.log('MNB: ', mainNeutralBases);
					_.forEach(mainNeutralBases, function (base) {
						proximityController.getPlayersInProximity(serverName, _.get(base, 'centerLoc'), 3.4, false, curPlayerUnit.coalition)
							.then(function (unitsInProx) {
								if(_.find(unitsInProx, {playername: curPlayerUnit.playername})) {
									masterDBController.unitActions('read', serverName, {_id: base.name + ' Logistics', dead: false})
										.then(function (cmdCenters) {
											if (cmdCenters.length > 0) {
												console.log('player own CC??: ' + _.first(cmdCenters).coalition === curPlayerUnit.coalition);
												if(_.first(cmdCenters).coalition === curPlayerUnit.coalition) {
													console.log('cmdCenter already exists, replace units: ' + base.name + ' ' + cmdCenters);
													DCSLuaCommands.sendMesgToGroup(
														curPlayerUnit.groupId,
														serverName,
														'G: ' + base.name + ' Command Center Already Exists, Support Units Replaced.',
														5
													);
													// console.log('SSB: ', serverName, base.name, curPlayerUnit.coalition);
													groupController.spawnSupportBaseGrp( serverName, base.name, curPlayerUnit.coalition );
												} else {
													console.log(' enemy cmdCenter already exists: ' + base.name + ' ' + cmdCenters);
													DCSLuaCommands.sendMesgToGroup(
														curPlayerUnit.groupId,
														serverName,
														'G: Enemy ' + base.name + ' Command Center Already Exists.',
														5
													);
												}
												resolve(false);
											} else {
												console.log('cmdCenter doesnt exist ' + base.name);
												groupController.spawnLogisticCmdCenter(serverName, {}, false, base, curPlayerUnit.coalition);
												masterDBController.baseActions('updateSide', serverName, {name: base.name, side: curPlayerUnit.coalition})
													.then(function () {
														baseSpawnFlagsController.setbaseSides(serverName);
														groupController.spawnSupportBaseGrp( serverName, base.name, curPlayerUnit.coalition );
														resolve(true);
													})
													.catch(function (err) {
														console.log('erroring line162: ', err);
													})
												;
												DCSLuaCommands.sendMesgToCoalition(
													curPlayerUnit.coalition,
													serverName,
													'C: ' + base.name + ' Command Center Is Now Built!',
													20
												);
											}
										})
										.catch(function (err) {
											reject(err);
											console.log('erroring line162: ', err);
										})
									;
								}
							})
							.catch(function (err) {
								reject(err);
								console.log('line 1297: ', err);
							})
						;
					});
				})
				.catch(function (err) {
					reject(err);
					console.log('line 1303: ', err);
				})
			;
		});
	}
});
