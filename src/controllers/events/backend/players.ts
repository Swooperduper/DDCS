/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const _ = require('lodash');
const constants = require('../../constants');
const masterDBController = require('../../db/masterDB');
const DCSLuaCommands = require('../../player/DCSLuaCommands');
const sideLockController = require('../../action/sideLock');

_.set(exports, 'processPlayerEvent', function (serverName, sessionName, playerArray) {
	_.set(exports, ['rtPlayerArray', serverName], playerArray.data);
	_.forEach(playerArray.data, function (player) {
		if (player) {
			var curPlyrUcid = player.ucid;
			var curPlyrSide = player.side;
			var curPlyrName = player.name;
      var isArtilleryCmdr = _.includes(player.slot, 'artillery_commander');
      var isForwardObserver = _.includes(player.slot, 'forward_observer');

			masterDBController.srvPlayerActions('read', serverName, {_id: curPlyrUcid, banned: true})
				.then(function (banUser) {
					if (!_.isEmpty(banUser)){
						console.log('Banning User: ', curPlyrName, curPlyrUcid, player.ipaddr);
						DCSLuaCommands.kickPlayer(
							serverName,
							player.id,
							'You have been banned from this server.'
						);
					} else {
						if (curPlyrName === '') {
							console.log('Banning User for blank name: ', curPlyrName, curPlyrUcid, player.ipaddr);
							DCSLuaCommands.kickPlayer(
								serverName,
								player.id,
								'You have been kicked from this server for having a blank name.'
							);
						}

						masterDBController.unitActions('read', serverName, {playername: curPlyrName, dead: false})
							.then(function (unit) {
								var curUnit = _.get(unit, 0);
								var curUnitSide = _.get(curUnit, 'coalition');
								if(curUnit) {
									// switching to spectator gets around this, fix this in future please
									if ((curUnitSide !== curPlyrSide) && curPlyrSide !== 0 && curPlyrSide) {
										if (curUnitSide) {
											DCSLuaCommands.sendMesgToAll(
												serverName,
												curPlyrName + ' Has Switch To ' + constants.side[curPlyrSide],
												15
											);
										}
									}
									if (isArtilleryCmdr || isForwardObserver) {
										masterDBController.srvPlayerActions('read', serverName, { _id: player.ucid })
											.then(function (srvPlayer) {
												var curPlayer = _.first(srvPlayer);
												if (curPlayer.gciAllowed || isForwardObserver) {
													if (curPlayer.sideLock === 0) {
														masterDBController.srvPlayerActions('update', serverName, {
															_id: player.ucid,
															sideLock: player.side,
															sideLockTime: new Date().getTime() + (60 * 60 * 1000)
														})
															.then(function (srvPlayer) {
																sideLockController.setSideLockFlags(serverName);
																console.log(player.name + ' is now locked to ' + player.side);
															})
															.catch(function (err) {
																console.log('line120', err);
															})
														;
													}
												} else {
													if (_.get(constants, 'config.isJtacLocked')) {
														DCSLuaCommands.forcePlayerSpectator(serverName, player.id, 'You are not allowed to use GCI/Tac Commander slot. Please contact a Mod for more information.');
													}
												}
											})
											.catch(function (err) {
												console.log('line120', err);
											})
										;
									}
								}
							})
							.catch(function (err) {
								console.log('err line87: ', err);
							})
						;
					}
				})
				.catch(function (err) {
					console.log('line886', err);
				})
			;
		}
	});
	_.forEach(playerArray.data, function (data) {
		var curData = _.cloneDeep(data);
		if (_.get(curData, 'ucid')) {
			_.set(curData, '_id', curData.ucid);
			_.set(curData, 'playerId', curData.id);
			_.set(curData, 'sessionName', sessionName);
			masterDBController.srvPlayerActions('updateFromServer', serverName, curData)
				.catch(function (err) {
					console.log('line156', err);
				})
			;
		}
	});
});

